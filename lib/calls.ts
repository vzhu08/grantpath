import { extractFields } from "../modules/extraction/src/index";
import { rankCandidates } from "../modules/recommendations/src/index";
import { localDate } from "./dates";
import { cite, latest, sourceDocument } from "./evidence";
import {
  unknownDeadline,
  type Opportunity,
  type Source,
  type Requirement,
  type Project,
  type Criterion,
} from "./schema";

export function extractCall(source: Source) {
  const result = extractFields(sourceDocument(source), [
    { key: "applicantType", label: "Applicant type" },
    { key: "careerStage", label: "Career stage" },
    { key: "country", label: "Country" },
    { key: "institution", label: "Institution" },
    { key: "tags", label: "Topics" },
    { key: "min", label: "Funding minimum", kind: "price" },
    { key: "max", label: "Funding maximum", kind: "price" },
    { key: "currency", label: "Currency" },
    { key: "deadline", label: "Deadline" },
  ]);
  const field = (key: string) => result.fields.find((f) => f.key === key)!;
  const criteria: Criterion[] = [];
  for (const key of [
    "applicantType",
    "careerStage",
    "country",
    "institution",
  ] as const) {
    const f = field(key);
    for (const candidate of f.candidates)
      criteria.push({
        field: key,
        values: String(candidate.value)
          .split("|")
          .map((x) => x.trim())
          .filter(Boolean),
        confirmed: false,
        conflict: f.status === "ambiguous",
        citation: {
          sourceId: source.id,
          version: latest(source).version,
          hash: latest(source).hash,
          quote: candidate.evidence.quote,
          start: candidate.evidence.start,
          end: candidate.evidence.end,
        },
        manual: false,
      });
  }
  const rawDate = field("deadline")
    .candidates.map((c) => c.raw)
    .join(" / ");
  return {
    criteria,
    tags: String(field("tags").value ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    minAmount:
      typeof field("min").value === "number"
        ? (field("min").value as number)
        : null,
    maxAmount:
      typeof field("max").value === "number"
        ? (field("max").value as number)
        : null,
    currency: /^[A-Z]{3}$/.test(String(field("currency").value))
      ? String(field("currency").value)
      : "",
    deadline: unknownDeadline(rawDate),
    reviewed: false,
  };
}
const sectionKey = (label: string): Requirement["sectionKey"] =>
  /summary/i.test(label)
    ? "summary"
    : /significance/i.test(label)
      ? "significance"
      : /approach/i.test(label)
        ? "approach"
        : null;
export function extractRequirements(source: Source): Requirement[] {
  const extracted = extractFields(sourceDocument(source), [
    { key: "section", label: "Section", kind: "requirement" },
    { key: "document", label: "Document", kind: "requirement" },
    { key: "task", label: "Requirement", kind: "requirement" },
    { key: "optional", label: "Optional", kind: "requirement" },
  ]);
  return extracted.fields.flatMap((field) =>
    field.candidates.map((candidate, index) => {
      const raw = candidate.raw;
      const [description] = raw.split("|");
      const limit = /\b(\d+)\s*words?\b/i.exec(raw);
      return {
        id: `req-${source.id}-${latest(source).version}-${field.key}-${index}`,
        category:
          field.key === "optional"
            ? "task"
            : (field.key as Requirement["category"]),
        description: description!.trim(),
        obligation:
          field.key === "optional" || /\boptional\b/i.test(raw)
            ? ("optional" as const)
            : /\b(?:unknown|to be confirmed)\b/i.test(raw)
              ? ("unknown" as const)
              : ("required" as const),
        origin: "sponsor" as const,
        review: "proposed" as const,
        status: "Missing" as const,
        citation: {
          sourceId: source.id,
          version: latest(source).version,
          hash: latest(source).hash,
          quote: candidate.evidence.quote,
          start: candidate.evidence.start,
          end: candidate.evidence.end,
        },
        manual: false,
        due: unknownDeadline("", "Optional internal target has not been set."),
        wordLimit: limit ? Number(limit[1]) : null,
        sectionKey: field.key === "section" ? sectionKey(description!) : null,
        linkedSourceId: null,
        reference: "",
        note: "",
        responsible: "",
      };
    }),
  );
}
export type Match = {
  opportunity: Opportunity;
  status: "Potential fit" | "Needs confirmation" | "Known mismatch" | "Closed";
  reasons: string[];
  unresolved: string[];
  quotes: string[];
  preferences: string[];
  rank: number;
};
export function matchOpportunities(
  project: Project,
  calls: Opportunity[],
  now = new Date(),
): Match[] {
  const matches: Match[] = calls.map((opportunity) => {
    const reasons: string[] = [],
      unresolved: string[] = [],
      quotes: string[] = [];
    let mismatch = false;
    for (const criterion of opportunity.criteria) {
      const actual = project.profile[criterion.field].trim();
      if (criterion.citation) quotes.push(criterion.citation.quote);
      if (criterion.manual)
        reasons.push(
          `${criterion.field}: user-entered override; quoted text may not support this interpretation.`,
        );
      if (criterion.conflict) {
        unresolved.push(
          `${criterion.field}: conflicting source criteria require correction.`,
        );
        continue;
      }
      if (!criterion.confirmed) {
        unresolved.push(
          `${criterion.field}: call criterion needs confirmation.`,
        );
        continue;
      }
      if (!actual) {
        unresolved.push(`${criterion.field}: project fact is unknown.`);
        continue;
      }
      if (
        !criterion.values.some(
          (v) => v.trim().toLowerCase() === actual.toLowerCase(),
        )
      ) {
        mismatch = true;
        reasons.push(
          `${criterion.field}: project "${actual}" does not meet "${criterion.values.join(" or ")}".`,
        );
      } else
        reasons.push(
          `${criterion.field}: project "${actual}" matches "${criterion.values.join(" or ")}".`,
        );
    }
    if (!opportunity.reviewed || !opportunity.criteria.length)
      unresolved.push(
        "The modeled eligibility assessment has not been completed; other call conditions may apply.",
      );
    if (opportunity.deadline.kind === "unknown")
      unresolved.push(
        `Deadline unresolved: ${opportunity.deadline.raw || "not supplied"}.`,
      );
    const d = opportunity.deadline;
    // Date-only cutoffs remain unknown throughout that calendar date; never invent a cutoff time.
    const closed =
      d.kind === "date"
        ? d.date < localDate(now)
        : d.kind === "exact"
          ? Date.parse(d.at) < now.getTime()
          : false;
    if (closed) reasons.push("The confirmed sponsor deadline is past.");
    const topic = project.profile.tags.filter((t) =>
      opportunity.tags.some((c) => c.toLowerCase() === t.toLowerCase()),
    );
    const preferences = [
      `Topics in common: ${topic.join(", ") || "none recorded"}.`,
    ];
    if (
      project.profile.fundingNeed !== null &&
      opportunity.currency === project.profile.currency &&
      opportunity.minAmount !== null &&
      opportunity.maxAmount !== null
    )
      preferences.push(
        `Requested ${project.profile.fundingNeed} ${project.profile.currency}; call range ${opportunity.minAmount}-${opportunity.maxAmount} ${opportunity.currency}.`,
      );
    else
      preferences.push(
        "Funding comparison unavailable: confirm amount, range and matching currency.",
      );
    return {
      opportunity,
      status: closed
        ? "Closed"
        : mismatch
          ? "Known mismatch"
          : unresolved.length
            ? "Needs confirmation"
            : "Potential fit",
      reasons,
      unresolved,
      quotes,
      preferences,
      rank: 0,
    };
  });
  const fits = matches.filter((m) => m.status === "Potential fit");
  const ranking = rankCandidates(
    fits.map((m) => ({
      id: m.opportunity.id,
      name: m.opportunity.title,
      tags: m.opportunity.tags.map((t) => t.toLowerCase()),
      metrics: {
        funding:
          project.profile.fundingNeed !== null &&
          project.profile.currency === m.opportunity.currency &&
          m.opportunity.minAmount !== null &&
          m.opportunity.maxAmount !== null &&
          project.profile.fundingNeed >= m.opportunity.minAmount &&
          project.profile.fundingNeed <= m.opportunity.maxAmount
            ? 1
            : 0,
      },
    })),
    [
      {
        memberId: project.id,
        preferredTags: project.profile.tags.map((t) => t.toLowerCase()),
        tagWeight: 2,
        weights: { funding: { weight: 1, direction: "higher" } },
      },
    ],
  );
  for (const [i, result] of ranking.ranked.entries())
    fits.find((m) => m.opportunity.id === result.candidate.id)!.rank = i + 1;
  const order = [
    "Potential fit",
    "Needs confirmation",
    "Known mismatch",
    "Closed",
  ];
  return matches.sort(
    (a, b) =>
      order.indexOf(a.status) - order.indexOf(b.status) ||
      a.rank - b.rank ||
      a.opportunity.title.localeCompare(b.opportunity.title),
  );
}
