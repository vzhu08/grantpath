import { SECTION_KEYS, type SectionKey } from "./schema";

export const ANNUAL_TEMPLATE = {
  id: "nsf-annual-narrative-v1", version: 1, checkedDate: "2026-10-25",
  scopeNote: "NSF standard research award annual narrative preparation worksheet. Local review is not sponsor submission, certification or acceptance.",
  coverageLimits: [
    "Current GC-1 body and downloadable portal template were inaccessible during research; exact portal fidelity is unverified.",
    "Structured product/PAR metadata, participant roster/person-months/demographics and portal checks are not collected.",
    "Applicable award conditions, actual reporting period and special requirements require human confirmation.",
  ],
  policyUrls: ["https://www.nsf.gov/policies/pappg/24-1/ch-7-award-administration",
    "https://www.nsf.gov/policies/research-performance-progress-reports",
    "https://www.nsf.gov/policies/pappg24-1-supplement-2", "https://www.nsf.gov/awards/terms-conditions"],
};
export const ANNUAL_SECTIONS: Record<SectionKey, { title: string; prompt: string }> = {
  accomplishments: { title: "Accomplishments", prompt: "Approved goals; actual work/results; unmet goals; training, dissemination, broader impacts and next-period plans. Keep results and plans separate." },
  products: { title: "Products", prompt: "Evidence-backed narrative inventory and supplied identifiers. Portal/PAR entry and deposit checks remain separate." },
  participants: { title: "Participants/Organizations", prompt: "Review supplied contributions. Structured roster, person-months and demographics remain incomplete." },
  impact: { title: "Impact", prompt: "Describe supported effects and broader-impact activities with uncertainty; predicted impact is a plan." },
  changes: { title: "Changes/Problems", prompt: "Delays, negative or inconclusive findings, causes and recovery plans. Distinguish pending sponsor requests." },
  special: { title: "Special Requirement", prompt: "Use the actual award's confirmed requirements, or an explicit reviewed not-applicable decision. Unknown is not none." },
};
export const orderedSections = () => SECTION_KEYS.map(key => ({ key, ...ANNUAL_SECTIONS[key] }));
