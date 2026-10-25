import { readRequestBytes } from "../../../packages/runtime/src/body";
import { assertLocalRequest } from "../../../lib/http";
import { UploadMetadataSchema } from "../../../lib/vault/schema";
import { uploadDocument, recoverVault } from "../../../lib/vault/service";
import { errorResponse, KitError } from "../../../packages/runtime/src/index";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    assertLocalRequest(request, "binary");
    if (request.headers.get("content-type") !== "application/octet-stream")
      throw new KitError("CONTENT_TYPE", "Send raw file bytes.", 415);
    const h = request.headers.get("x-upload-metadata") ?? "";
    if (Buffer.byteLength(h) > 4096 || !/^[A-Za-z0-9_-]+$/.test(h))
      throw new KitError("METADATA", "Invalid bounded upload metadata.", 400);
    let decoded:unknown;
    try{decoded=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(Buffer.from(h,"base64url")));}
    catch{throw new KitError("METADATA","Upload metadata must be valid UTF-8 JSON.",400);}
    const meta=UploadMetadataSchema.parse(decoded);
    const length = request.headers.get("content-length");
    if (length && (!/^\d+$/.test(length) || Number(length) > 10000000))
      throw new KitError("BODY_LIMIT", "File exceeds 10,000,000 bytes.", 413);
    if (!request.body) throw new KitError("EMPTY", "Choose a file.", 400);
    const bytes = await readRequestBytes(request, 10000000, 15000);
    if (length && bytes.length !== Number(length))
      throw new KitError(
        "BODY_LENGTH",
        "Body length does not match its declared length.",
        400,
      );
    await recoverVault();
    const result = await uploadDocument(meta, bytes);
    return Response.json(result, {
      status: 201,
      headers: { "cache-control": "no-store" },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
