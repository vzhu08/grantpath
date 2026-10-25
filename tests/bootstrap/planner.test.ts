import { describe, expect, it } from "vitest";
import { planBootstrap, validateInput, inputDigest, canonical, parsePlanningInput } from "../../modules/bootstrap/src/index";
import { amount, gap, link, node, range, referenceInput, tinyInput } from "./reference-input";

describe("Bootstrap exact planner independent references", () => {
  it("matches hand closure, shared interpretation and separate funding branches", () => {
    const input = referenceInput(), before = canonical(input), result = planBootstrap(input), [base, funded] = result.branches;
    expect(base!.enumeratedSubsetCount).toBe(64); expect(base!.uniqueClosureCount).toBe(6);
    expect(base!.outcome).toBe("partial"); expect(base!.completeStatus).toBe("no-robust-complete");
    expect(base!.partials[0]!.nodeIds).toEqual(["D", "I", "Q", "S", "V"]);
    expect(base!.partials[0]!.totals.cashCents).toMatchObject({ low: 10000, high: 20000 });
    expect(base!.partials[0]!.totals.elapsedMinutes).toMatchObject({ low: 180, high: 360 });
    expect(base!.partials[0]!.uncoveredGapIds).toEqual(["G2"]);
    expect(funded!.conditional).toBe(true); expect(funded!.conditions).toHaveLength(1); expect(funded!.availableCashCents).toBe(27000);
    expect(funded!.complete!.totals.cashCents).toMatchObject({ low: 12500, high: 25000 });
    expect(funded!.complete!.totals.elapsedMinutes).toMatchObject({ low: 210, high: 420 });
    expect(funded!.complete!.nodeIds).toHaveLength(6); expect(funded!.minimumStatus).toBe("proven-minimum"); expect(canonical(input)).toBe(before);
  });
  it("uses upper endpoints, not cheap lower prices, after cost increase", () => {
    const input = referenceInput(); input.catalog.nodes.find(n => n.id === "D")!.cashCents.high = 9000;
    const [base, funded] = planBootstrap(input).branches;
    expect(base!.complete).toBeNull(); expect(base!.partials).toHaveLength(0);
    expect(funded!.complete).toBeNull(); expect(funded!.partials[0]!.totals.cashCents.high).toBe(23000);
    expect(funded!.alternatives.some(a => a.nodeIds.length === 6 && a.violations.includes("cashCents:upper-bound-exceeds-available"))).toBe(true);
  });
  it.each(["denied", "withdrawn"] as const)("does not count %s money", status => {
    const v = referenceInput(); v.funding[0]!.status = status; v.hypotheticalFundingIds = [];
    const b = planBootstrap(v).branches[0]!; expect(b.availableCashCents).toBe(21000); expect(b.complete).toBeNull();
  });
  it.each(["after-window", "restricted"])("excludes unusable confirmed funding: %s", reason => {
    const v = referenceInput(); v.funding[0]!.status = "confirmed"; v.hypotheticalFundingIds = [];
    if (reason === "after-window") v.funding[0]!.available = "after-window"; else v.funding[0]!.scope = "restricted";
    expect(planBootstrap(v).branches[0]!.availableCashCents).toBe(21000);
  });
  it("counts confirmed eligible funding without a hypothetical branch", () => {
    const v = referenceInput(); v.funding[0]!.status = "confirmed"; v.hypotheticalFundingIds = [];
    const r = planBootstrap(v); expect(r.branches).toHaveLength(1); expect(r.branches[0]!.complete).not.toBeNull(); expect(r.branches[0]!.conditional).toBe(false);
  });
  it.each(["elapsedMinutes", "effortMinutes", "computeMinutes", "ramMiB", "storageMiB"] as const)("enforces independent %s capacity", resource => {
    const v = referenceInput(); v.resources.cashCents = amount(100000);
    if (resource === "elapsedMinutes" || resource === "effortMinutes") v.resources[resource] = amount(390);
    else if (resource === "computeMinutes") { v.catalog.nodes.find(n => n.id === "D")!.computeMinutes = range(10, 20); v.resources.computeMinutes = amount(19); }
    else v.resources[resource] = amount(1000);
    expect(planBootstrap(v).branches[0]!.complete).toBeNull();
  });
  it("uses serial peak RAM rather than summing simultaneous capacity", () => { const v = referenceInput(); v.resources.cashCents = amount(30000); v.resources.ramMiB = amount(4096); expect(planBootstrap(v).branches[0]!.complete).not.toBeNull(); });
  it("beats a per-analysis greedy rule using shared setup", () => {
    const v = tinyInput(); v.gaps.push(gap("G2")); v.catalog.nodes = [node("P", 70, 70, 1, 1), node("P2", 70, 70, 1, 1), node("T", 60, 60, 1, 1), node("B", 20, 20, 1, 1, ["T"]), node("C", 20, 20, 1, 1, ["T"])];
    v.catalog.products = ["P", "P2", "B", "C"].map(id => ({ id, nodeIds: [id], description: id })); v.catalog.links = [link("p", "G1", "P"), link("p2", "G2", "P2"), link("b", "G1", "B"), link("c", "G2", "C")];
    expect(planBootstrap(v).branches[0]!.complete!.nodeIds).toEqual(["B", "C", "T"]); expect(planBootstrap(v).branches[0]!.complete!.totals.cashCents.high).toBe(100);
    v.gaps[1]!.required = false; expect(planBootstrap(v).branches[0]!.complete!.nodeIds).toEqual(["P"]);
  });
  it("keeps equal-cardinality different-gap partials nondominated", () => {
    const v = tinyInput(); v.gaps.push(gap("G2"), gap("G3")); v.catalog.nodes.push(node("B", 20, 20, 1, 1)); v.catalog.products.push({ id: "p2", nodeIds: ["B"], description: "B" }); v.catalog.links.push(link("l2", "G2", "p2")); v.resources.cashCents = amount(20);
    const b = planBootstrap(v).branches[0]!; expect(b.completeStatus).toBe("no-robust-complete"); expect(b.partials.map(p => p.coveredGapIds)).toEqual([["G1"], ["G2"]]);
  });
  it("reports frontier truncation with complete count", () => {
    const v = tinyInput(); v.gaps.push(gap("G2")); v.catalog.nodes = Array.from({ length: 10 }, (_, i) => node(`N${i}`, i + 1, i + 1, 10 - i, 10 - i));
    v.catalog.products = v.catalog.nodes.map(n => ({ id: `p${n.id}`, nodeIds: [n.id], description: n.id })); v.catalog.links = v.catalog.products.map(p => link(`l${p.id}`, "G1", p.id));
    const b = planBootstrap(v).branches[0]!; expect(b.frontierCount).toBe(10); expect(b.frontierTruncated).toBe(true); expect(b.partials).toHaveLength(8);
  });
  it("does not promote weak/rejected/unknown relevance to coverage", () => {
    for (const relation of ["weak", "rejected", "unknown", "none"] as const) {
      const v = tinyInput(); v.catalog.links[0]!.relation = relation; const b = planBootstrap(v).branches[0]!;
      expect(b.complete).toBeNull(); expect(b.completeStatus).toBe(relation === "unknown" ? "needs-input" : "no-robust-complete");
    }
  });
  it("keeps unknown alternatives best-known and independently impossible alternatives irrelevant", () => {
    const v = tinyInput(); v.catalog.nodes.push(node("U", 0, 20, 1, 1)); v.catalog.nodes[1]!.cashCents = range(0, null); v.catalog.products.push({ id: "u", nodeIds: ["U"], description: "Unknown alternative" }); v.catalog.links.push(link("u", "G1", "u"));
    expect(planBootstrap(v).branches[0]!.minimumStatus).toBe("best-known");
    v.catalog.nodes[1]!.cashCents.low = 30000; expect(planBootstrap(v).branches[0]!.minimumStatus).toBe("proven-minimum");
    v.catalog.nodes[0]!.suitability = "rejected"; v.catalog.nodes[1]!.cashCents.low = 0; expect(planBootstrap(v).branches[0]!.completeStatus).toBe("needs-input");
  });
  it("does not let an irrelevant unknown superset suppress a known minimum", () => { const v = tinyInput(); const u = node("U", 0, 0, 0, 0); u.cashCents = range(0, null); v.catalog.nodes.push(u); expect(planBootstrap(v).branches[0]!.minimumStatus).toBe("proven-minimum"); });
  it("retains a lexicographically better unresolved zero-addition alternative as best-known", () => {
    const v = tinyInput(); v.catalog.nodes[0]!.id = "B"; v.catalog.nodes[0]!.sharedKey = "shared-B"; v.catalog.products[0]!.nodeIds = ["B"]; const u = node("A", 0, 0, 0, 0); u.cashCents = range(0, null); v.catalog.nodes.push(u);
    expect(planBootstrap(v).branches[0]!.minimumStatus).toBe("best-known");
  });
  it("does not use an expired quote or budget as proof of infeasibility", () => {
    const v = tinyInput(); v.catalog.nodes[0]!.cashCents = range(50000, 50000); v.catalog.nodes[0]!.provenance.validUntil = v.asOf; v.asOf = "2026-10-26T12:00:00.000Z";
    expect(planBootstrap(v).branches[0]!.completeStatus).toBe("needs-input");
    v.catalog.nodes[0]!.provenance.validUntil = "2026-11-01T12:00:00.000Z"; v.resources.provenance.validUntil = "2026-10-25T12:00:00.000Z";
    expect(planBootstrap(v).branches[0]!.completeStatus).toBe("needs-input");
  });
  it("never turns increased costs or removed funding into new feasibility", () => {
    const v = referenceInput(); const before = planBootstrap(v).branches[1]!.complete!;
    for (const n of v.catalog.nodes) { n.cashCents.low! += 10000; n.cashCents.high! += 10000; }
    expect(planBootstrap(v).branches[1]!.complete).toBeNull(); expect(before.totals.cashCents.high).toBe(25000);
    const w = referenceInput(); w.funding = []; w.hypotheticalFundingIds = []; expect(planBootstrap(w).branches[0]!.complete).toBeNull();
  });
  it("distinguishes a known infeasible interval from missing input", () => { const v = tinyInput(); v.catalog.nodes[0]!.cashCents = range(100, 300); v.resources.cashCents = amount(210); expect(planBootstrap(v).branches[0]!.completeStatus).toBe("no-robust-complete"); v.catalog.nodes[0]!.cashCents.high = null; expect(planBootstrap(v).branches[0]!.completeStatus).toBe("needs-input"); });
  it("retains independent known violations when another dimension is unknown", () => { const v = tinyInput(); v.catalog.nodes[0]!.cashCents = range(0, null); v.catalog.nodes[0]!.reviewer = "denied"; expect(planBootstrap(v).branches[0]!.completeStatus).toBe("no-robust-complete"); });
  it("uses known subtotals to rule out unknown bundles independently", () => {
    const v = tinyInput(); v.resources.cashCents = amount(70); v.catalog.nodes.push(node("T", 20, 100, 1, 1), node("U", 0, 0, 1, 1, ["T"])); v.catalog.nodes[2]!.cashCents = range(null, null);
    v.catalog.products.push({ id: "u", nodeIds: ["U"], description: "Unknown alternate" }); v.catalog.links.push(link("u", "G1", "u"));
    expect(planBootstrap(v).branches[0]!.minimumStatus).toBe("proven-minimum");
  });
  it("does not let an unknown duplicate link poison accepted coverage", () => {
    const v = referenceInput(); v.catalog.links.push({ ...link("alternate", "G1", "effect"), relation: "unknown", decision: "unreviewed", qualification: "unreviewed" });
    expect(planBootstrap(v).branches[1]!.complete).not.toBeNull();
  });
  it("retains known partial coverage while an extra target needs link review", () => {
    const v = tinyInput(); v.gaps.push(gap("G2")); v.catalog.links.push({ ...link("u", "G2", "p"), relation: "unknown" });
    const b = planBootstrap(v).branches[0]!; expect(b.completeStatus).toBe("needs-input"); expect(b.partials[0]!.coveredGapIds).toEqual(["G1"]); expect(b.partials[0]!.uncoveredGapIds).toEqual(["G2"]);
  });
  it("can rule out a bundle even against known maximum uncertain funding", () => {
    const v = referenceInput(); v.catalog.nodes.find(n => n.id === "D")!.cashCents.high = 12000; v.funding[0]!.available = "unknown";
    expect(planBootstrap(v).branches[1]!.completeStatus).toBe("no-robust-complete");
  });
  it("retains known guaranteed cash when extra confirmed funding availability is unknown", () => {
    const v = referenceInput(); v.funding[0]!.status = "confirmed"; v.funding[0]!.available = "unknown"; v.hypotheticalFundingIds = [];
    const b = planBootstrap(v).branches[0]!; expect(b.availableCashCents).toBeNull(); expect(b.guaranteedCashCents).toBe(21000); expect(b.maximumPossibleCashCents).toBe(27000); expect(b.partials[0]!.totals.cashCents.high).toBe(20000);
  });
  it("returns explicit reasons for uncovered or rejected targets", () => { const v = tinyInput(); v.catalog.links[0]!.relation = "rejected"; expect(planBootstrap(v).branches[0]!.coverageNotes[0]).toContain("rejected"); v.catalog.links = []; expect(planBootstrap(v).branches[0]!.coverageNotes).toContain("gap:G1:no-catalog-link"); });
  it("accepts safe aggregate values larger than per-node limits", () => {
    const v = tinyInput(); v.catalog.nodes[0]!.cashCents = range(1_000_000_000, 1_000_000_000); v.catalog.nodes.push(node("B", 1_000_000_000, 1_000_000_000, 0, 0)); v.catalog.nodes[0]!.dependencies = ["B"];
    v.resources.cashCents = amount(1_000_000_000); v.funding = [{ ...referenceInput().funding[0]!, status: "confirmed", amountCents: amount(1_000_000_000) }];
    expect(planBootstrap(v).branches[0]!.complete!.totals.cashCents.high).toBe(2_000_000_000);
  });
  it("enforces exclusivity even when shared candidates appear cheaper", () => { const v = referenceInput(); for (const n of v.catalog.nodes.filter(n => ["D", "R"].includes(n.id))) n.exclusionGroups = ["method"]; expect(planBootstrap(v).branches[1]!.complete).toBeNull(); });
  it("normalizes semantic permutations without changing digest or result", () => {
    const v = referenceInput(), original = planBootstrap(v); v.catalog.nodes.reverse(); v.catalog.products.reverse(); v.catalog.links.reverse(); v.gaps.reverse(); v.catalog.products.forEach(p => p.nodeIds.reverse());
    expect(inputDigest(v)).toBe(original.inputDigest); expect(planBootstrap(v)).toEqual(original);
  });
  it("searches the 12-node boundary with complete dependency closure", () => {
    const v = tinyInput(); v.catalog.nodes = Array.from({ length: 12 }, (_, i) => node(`N${i}`, 1, 1, 1, 1, i ? [`N${i - 1}`] : []));
    v.catalog.products[0]!.nodeIds = ["N11"];
    const b = planBootstrap(v).branches[0]!; expect(b.enumeratedSubsetCount).toBe(4096); expect(b.uniqueClosureCount).toBe(13); expect(b.complete!.nodeIds).toHaveLength(12); expect(b.complete!.totals.cashCents.high).toBe(12);
  });
  it("breaks equal-price ties by elapsed, then effort, then stable node IDs", () => {
    const v = tinyInput(); v.catalog.nodes = [node("A", 10, 10, 1, 5), node("B", 10, 10, 1, 3), node("C", 10, 10, 1, 3)];
    v.catalog.nodes[1]!.effortMinutes = range(1, 2); v.catalog.nodes[2]!.effortMinutes = range(1, 1);
    v.catalog.products = v.catalog.nodes.map(n => ({ id: n.id, nodeIds: [n.id], description: n.id })); v.catalog.links = v.catalog.nodes.map(n => link(n.id, "G1", n.id));
    expect(planBootstrap(v).branches[0]!.complete!.nodeIds).toEqual(["C"]);
    v.catalog.nodes[1]!.effortMinutes = range(1, 1); expect(planBootstrap(v).branches[0]!.complete!.nodeIds).toEqual(["B"]);
  });
  it("matches an independent raw-subset oracle across generated small instances", () => {
    // Oracle rejects nonclosed raw sets instead of using the engine's closure expansion.
    for (let seed = 1; seed <= 24; seed++) {
      const v = tinyInput(); v.gaps.push(gap("G2")); v.catalog.nodes = Array.from({ length: 5 }, (_, i) => node(`N${i}`, (seed * (i + 3)) % 17, (seed * (i + 3)) % 17, i + 1, i + 1, i > 1 && (seed + i) % 2 === 0 ? [`N${i - 2}`] : []));
      v.catalog.products = v.catalog.nodes.map(n => ({ id: n.id, nodeIds: [n.id], description: n.id })); v.catalog.links = v.catalog.nodes.map((n, i) => link(n.id, i % 2 ? "G2" : "G1", n.id)); v.resources.cashCents = amount(25 + seed);
      const options: { ids: string[]; cash: number; time: number }[] = [];
      for (let m = 1; m < 32; m++) {
        const ns = v.catalog.nodes.filter((_, i) => (m & (2 ** i)) !== 0), ids = ns.map(n => n.id);
        if (ns.some(n => n.dependencies.some(d => !ids.includes(d)))) continue;
        if (!["G1", "G2"].every(g => v.catalog.links.some(l => l.gapId === g && ids.includes(l.productId)))) continue;
        const cash = ns.reduce((s, n) => s + n.cashCents.high!, 0), time = ns.reduce((s, n) => s + n.elapsedMinutes.high!, 0);
        if (cash <= v.resources.cashCents.value!) options.push({ ids, cash, time });
      }
      options.sort((a, b) => a.cash - b.cash || a.time - b.time || (a.ids.join("|") < b.ids.join("|") ? -1 : 1));
      expect(planBootstrap(v).branches[0]!.complete?.nodeIds ?? null).toEqual(options[0]?.ids ?? null);
    }
  });
  it.each(["unknown-key", "fraction", "negative", "inverted", "cycle", "unknown-node", "duplicate", "duplicate-id", "started", "cross-project", "unconfirmed", "blank", "archived", "currency", "future-confirmation", "bad-quote", "over-limit", "nan", "infinity", "unsafe"])("fails closed: %s", fault => {
    const v: any = referenceInput();
    if (fault === "unknown-key") v.catalog.nodes[0].surprise = true;
    if (fault === "fraction") v.resources.cashCents.value = 0.5;
    if (fault === "negative") v.resources.cashCents.value = -1;
    if (fault === "inverted") v.catalog.nodes[0].cashCents.low = 99999;
    if (fault === "cycle") v.catalog.nodes[0].dependencies = ["R"];
    if (fault === "unknown-node") v.catalog.nodes[0].dependencies = ["missing"];
    if (fault === "duplicate") v.catalog.nodes[0].sharedKey = v.catalog.nodes[1].sharedKey;
    if (fault === "duplicate-id") v.catalog.nodes[0].id = v.catalog.nodes[1].id;
    if (fault === "started") v.catalog.nodes[0].workState = "partially-incurred";
    if (fault === "cross-project") v.gaps[0].intake.projectId = "elsewhere";
    if (fault === "unconfirmed") v.gaps[0].intake.interpretationConfirmed = false;
    if (fault === "blank") v.gaps[0].intake.interpretation = "   ";
    if (fault === "archived") v.gaps[0].intake.attemptState = "archived";
    if (fault === "currency") v.resources.currency = "EUR";
    if (fault === "future-confirmation") v.gaps[0].intake.confirmedAt = "2026-10-26T12:00:00.000Z";
    if (fault === "bad-quote") v.gaps[0].intake.feedback[0].end = 9999;
    if (fault === "over-limit") v.catalog.nodes = Array.from({ length: 13 }, (_, i) => node(`N${i}`, 0, 0, 0, 0));
    if (fault === "nan") v.catalog.nodes[0].cashCents.high = NaN;
    if (fault === "infinity") v.catalog.nodes[0].cashCents.high = Infinity;
    if (fault === "unsafe") v.catalog.nodes[0].cashCents.high = Number.MAX_SAFE_INTEGER + 1;
    expect(() => validateInput(v)).toThrow();
  });
  it("rejects oversized bytes before parsing", () => { expect(() => parsePlanningInput(" ".repeat(80001))).toThrow(/bytes/); });
});
