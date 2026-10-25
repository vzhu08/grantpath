import { it, expect, beforeEach, afterEach, describe } from "vitest";
import { mkdir, mkdtemp, rm, readFile } from "node:fs/promises";
import path from "node:path";
import { createRepository } from "../../lib/repository";
import { POST as upload } from "../../app/api/documents/route";
import { GET as download } from "../../app/api/documents/[id]/versions/[versionId]/download/route";
import { GET as text } from "../../app/api/documents/[id]/versions/[versionId]/text/route";
import { assertLocalRequest } from "../../lib/http";
let directory: string, repo: ReturnType<typeof createRepository>;
const root = globalThis as typeof globalThis & {
  grantpathRepository?: ReturnType<typeof createRepository>;
};
function request(bytes: Uint8Array, overrides: Record<string, string> = {}) {
  const meta = {
    projectId: "demo-project",
    filename: "cv.pdf",
    claimedMime: "application/pdf",
    title: "Synthetic CV",
    category: "CV",
    owner: "Synthetic researcher",
    expectedRevision: 0,
    idempotencyKey: "route-upload",
  };
  return new Request("http://127.0.0.1:3102/api/documents", {
    method: "POST",
    headers: {
      host: "127.0.0.1:3102",
      origin: "http://127.0.0.1:3102",
      "content-type": "application/octet-stream",
      "x-upload-metadata": Buffer.from(JSON.stringify(meta)).toString(
        "base64url",
      ),
      ...overrides,
    },
    body: new Uint8Array(bytes),
  });
}
beforeEach(async () => {
  await mkdir(".test-data/vault-routes", { recursive: true });
  directory = await mkdtemp(path.resolve(".test-data/vault-routes/case-"));
  repo = createRepository(directory);
  root.grantpathRepository = repo;
});
afterEach(async () => {
  for (let i = 0; i < 150; i++) {
    const s = await repo.read();
    if (!s.parseAttempts.some((p) => ["pending", "running"].includes(p.status)))
      break;
    await new Promise((r) => setTimeout(r, 100));
  }
  delete root.grantpathRepository;
  await rm(directory, { recursive: true, force: true });
}, 25000);
describe("bounded local vault routes", { timeout: 30000 }, () => {
  it("enforces same-origin binary writes, blocked cross-site reads and bounded metadata/body", async () => {
    const bytes = await readFile("modules/documents/fixtures/text.pdf");
    expect(
      (await upload(request(bytes, { origin: "https://foreign.example" })))
        .status,
    ).toBe(403);
    expect(
      (await upload(request(bytes, { "sec-fetch-site": "cross-site" }))).status,
    ).toBe(403);
    expect(
      (await upload(request(bytes, { "content-type": "application/json" })))
        .status,
    ).toBe(415);
    expect(
      (await upload(request(bytes, { "x-upload-metadata": "x".repeat(4097) })))
        .status,
    ).toBe(400);
    expect(
      (await upload(request(bytes, { "content-length": "10000001" }))).status,
    ).toBe(413);
    expect(
      (await upload(request(bytes, { "content-length": "1" }))).status,
    ).toBe(400);
    expect((await upload(request(new Uint8Array(10000001)))).status).toBe(413);
    expect((await repo.read()).documentVersions).toHaveLength(0);
    expect(() =>
      assertLocalRequest(
        new Request("http://127.0.0.1:3102/api/documents/x", {
          headers: { "sec-fetch-site": "cross-site" },
        }),
      ),
    ).toThrow();
  });
  it("returns original verified bytes and no private storage paths; rejects mismatched IDs", async () => {
    const bytes = await readFile("modules/documents/fixtures/text.pdf"),
      response = await upload(request(bytes));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(JSON.stringify(body)).not.toContain(directory);
    const ctx = {
      params: Promise.resolve({
        id: body.documentId,
        versionId: body.versionId,
      }),
    };
    const get = await download(
      new Request("http://127.0.0.1:3102/api/documents"),
      ctx,
    );
    expect(get.status).toBe(200);
    expect(get.headers.get("content-disposition")).toContain("attachment");
    expect(get.headers.get("x-content-type-options")).toBe("nosniff");
    expect(Buffer.from(await get.arrayBuffer())).toEqual(bytes);
    expect(
      (
        await download(
          new Request("http://127.0.0.1:3102/api/documents", {
            headers: { "sec-fetch-site": "cross-site" },
          }),
          ctx,
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await download(new Request("http://127.0.0.1:3102/api/documents"), {
          params: Promise.resolve({ id: "foreign", versionId: body.versionId }),
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await text(
          new Request("http://127.0.0.1:3102/api/documents?attemptId=foreign"),
          ctx,
        )
      ).status,
    ).toBe(404);
  });
});
