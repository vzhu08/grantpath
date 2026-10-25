export function GET() {
  return Response.json(
    {
      status: "alive",
      service: "web",
      revision:
        process.env.VERCEL_GIT_COMMIT_SHA ??
        process.env.APP_REVISION ??
        "local",
    },
    { headers: { "cache-control": "no-store" } },
  );
}
