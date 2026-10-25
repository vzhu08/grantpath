export default { test: { include: ["tests/bootstrap/**/*.test.ts"], environment: "node", maxWorkers: 1, fileParallelism: false }, cacheDir: "./.test-data/bootstrap-cache" };
