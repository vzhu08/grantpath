export function GET() {
  return Response.json(
    {
      status: "alive",
      service: "grantpath",
      instance: process.env.GRANTPATH_INSTANCE_ID ?? 'foreground',
      build: process.env.GRANTPATH_BUILD_ID ?? 'development',
      revision:
        process.env.VERCEL_GIT_COMMIT_SHA ??
        process.env.APP_REVISION ??
        "local",
    },
    { headers: { "cache-control": "no-store" } },
  );
}
