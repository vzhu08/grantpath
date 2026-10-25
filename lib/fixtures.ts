import { newSource } from "./evidence";
import { extractCall, extractRequirements } from "./calls";
import { cite } from "./evidence";
import {
  type State,
  type Project,
  type Opportunity,
  type Application,
} from "./schema";

export function createDemo(): State {
  const at = new Date().toISOString();
  const project: Project = {
    id: "demo-project",
    revision: 1,
    provenance: "demo",
    createdAt: at,
    updatedAt: at,
    history: [],
    profile: {
      title: "Low-cost sensors for healthier urban waterways",
      abstract:
        "Develop and evaluate a low-cost water quality sensing workflow with community sampling. The proposed study will assess measurement reliability and practical deployment needs. No pilot results are available yet.",
      tags: ["water", "environment", "sensors"],
      applicantType: "University",
      institution: "Example University",
      careerStage: "Early career",
      country: "United States",
      fundingNeed: 45000,
      currency: "USD",
      startDate: "2027-03-01",
      endDate: "2028-02-29",
      knownFacts:
        "Synthetic project for demonstration. Ethics approval status is unknown. No completed pilot study is claimed.",
    },
  };
  const sources = [
    newSource({
      id: "demo-methods",
      projectId: project.id,
      title: "Proposed field methods",
      type: "methods",
      provenance: "demo",
      text: "This synthetic project proposes paired sensor and laboratory reference measurements at community-accessible sites. Calibration drift and missing measurements will be documented. Site access, sample size and deployment schedule still require confirmation. No pilot measurements have been collected.",
    }),
    newSource({
      id: "demo-team",
      projectId: project.id,
      title: "Team and facilities notes",
      type: "team",
      provenance: "demo",
      text: "The synthetic research team has experience in environmental measurement and data analysis. Shared bench space is planned but access has not been confirmed. Collaborator commitments and ethics approval are not established by these notes.",
    }),
  ];
  const specs = [
    {
      title: "Waterways Seed Research Award",
      applicant: "University",
      career: "Early career",
      country: "United States",
      deadline: "2027-02-15",
      reviewed: true,
    },
    {
      title: "Small Business Sensor Challenge",
      applicant: "For-profit company",
      career: "Early career",
      country: "United States",
      deadline: "2027-03-01",
      reviewed: true,
    },
    {
      title: "Senior Investigator Environment Fund",
      applicant: "University",
      career: "Established investigator",
      country: "United States",
      deadline: "2027-04-15",
      reviewed: true,
    },
    {
      title: "Regional Partner Exploratory Fund",
      applicant: "University",
      career: "Early career",
      country: "United States",
      deadline: "2027-05-15",
      reviewed: false,
    },
    {
      title: "Past Cycle Water Innovation Award",
      applicant: "University",
      career: "Early career",
      country: "United States",
      deadline: "2020-01-15",
      reviewed: true,
    },
    {
      title: "Community Science Catalyst",
      applicant: "University",
      career: "Early career",
      country: "United States",
      deadline: "03/04/2027, close of business",
      reviewed: true,
    },
  ];
  const opportunities: Opportunity[] = specs.map((spec, i) => {
    const source = newSource({
      id: `demo-call-source-${i + 1}`,
      projectId: null,
      title: spec.title,
      type: "call",
      provenance: "demo",
      text: `FICTIONAL DEMO CALL - no such funding opportunity is represented.\nFunder: Synthetic Research Foundation ${i + 1}\nApplicant type: ${spec.applicant}\nCareer stage: ${spec.career}\nCountry: ${spec.country}\n${i === 3 ? "Institution: Verified regional partner\n" : ""}Topics: water, environment, sensors\nFunding minimum: 20000\nFunding maximum: 60000\nCurrency: USD\nDeadline: ${spec.deadline}\nSection: Project summary | 250 words\nSection: Significance | 500 words\nSection: Approach overview | 750 words\nDocument: Applicant CV\nRequirement: Confirm site access and applicable ethics documentation\nOptional: Add a community engagement note`,
    });
    sources.push(source);
    const extracted = extractCall(source);
    return {
      ...extracted,
      id: `demo-call-${i + 1}`,
      title: spec.title,
      funder: `Synthetic Research Foundation ${i + 1}`,
      url: "",
      sourceId: source.id,
      sourceVersion: 1,
      revision: 1,
      provenance: "demo",
      importedAt: at,
      lastCheckedAt: spec.reviewed ? at : null,
      history: [],
      reviewed: spec.reviewed,
      criteria: extracted.criteria.map((c) => ({
        ...c,
        confirmed: spec.reviewed,
      })),
      deadline:
        i === 5
          ? extracted.deadline
          : {
              kind: "date",
              date: spec.deadline,
              raw: spec.deadline,
              confirmed: true,
            },
    };
  });
  return {
    schemaVersion: 2,
    contentLibrary: [],
    packetSnapshots: [],
    proposalExports: [],
    revision: 0,
    projects: [project],
    sources,
    opportunities,
    applications: [],
  };
}
export function createApplication(
  project: Project,
  call: Opportunity,
  state: State,
  id: string,
): Application {
  const at = new Date().toISOString();
  const source = state.sources.find((s) => s.id === call.sourceId)!;
  const requirements = extractRequirements(source);
  return {
    id,
    projectId: project.id,
    opportunityId: call.id,
    revision: 1,
    provenance: project.provenance === "demo" ? "demo" : "researcher",
    stage: "Considering",
    requirements,
    requirementsSourceVersion: call.sourceVersion,
    requirementsReviewed: false,
    requirementsHistory: [],
    waivers: [],
    createdAt: at,
    updatedAt: at,
    sections: [
      ["summary", "Project summary", 250],
      ["significance", "Significance", 500],
      ["approach", "Approach overview", 750],
    ].map(([key, label, wordLimit]) => ({
      key: key as "summary" | "significance" | "approach",
      label: String(label),
      wordLimit: Number(wordLimit),
      revisions: [],
    })),
  };
}
