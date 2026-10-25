import { LegacyStateSchema, StateSchema, type State } from "../schema";
import { legacyBinding, validateStateIntegrity } from "./workflow";
import { textBlocks } from "./blocks";
export function migrateV1(input: unknown): State {
  const old = LegacyStateSchema.parse(input);
  const applications = old.applications.map((app) => {
    const call = old.opportunities.find((c) => c.id === app.opportunityId);
    if (!call) throw new Error("Legacy application call missing.");
    return {
      ...app,
      binding: legacyBinding(app, call.revision, call.sourceVersion),
      bindingHistory: [],
      archivedSections: [],
      reuseDecisions: [],
      sections: app.sections.map((section) => ({
        ...section,
        reviews: [],
        revisions: section.revisions.map((draft) => ({
          ...draft,
          blocks: textBlocks(draft.text),
          representationVersion: 1 as const,
          bindingRevision: null,
          reusedContent: [],
        })),
      })),
    };
  });
  return validateStateIntegrity(
    StateSchema.parse({
      ...old,
      schemaVersion: 2,
      applications,
      contentLibrary: [],
      packetSnapshots: [],
      proposalExports: [],
    }),
  );
}
