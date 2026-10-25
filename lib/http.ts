import { KitError } from "../packages/runtime/src/index";
export function assertLocalRequest(
  request: Request,
  mutation: boolean | "binary" = false,
) {
  const internal = new URL(request.url);
  // Next may normalize request.url to localhost even when the browser used 127.0.0.1.
  // Validate the actual Host, never an arbitrary forwarded-host header.
  const url = new URL(
    internal.protocol + "//" + (request.headers.get("host") ?? internal.host),
  );
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
    throw new KitError(
      "LOCAL_ONLY",
      "Open the app on its loopback address.",
      403,
    );
  if (request.headers.get("sec-fetch-site") === "cross-site")
    throw new KitError(
      "ORIGIN",
      "Open files from the same local application.",
      403,
    );
  const origin = request.headers.get("origin");
  if (mutation && origin !== url.origin)
    throw new KitError(
      "ORIGIN",
      "Save changes from the same local app origin.",
      403,
    );
  if (
    mutation === true &&
    request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !==
      "application/json"
  )
    throw new KitError("CONTENT_TYPE", "Send application/json.", 415);
}
