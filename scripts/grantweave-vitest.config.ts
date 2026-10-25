import { defineConfig } from "vitest/config";
export default defineConfig({
  cacheDir: ".test-data/grantweave/vite",
  test: { include: ["tests/grantweave/**/*.test.ts"], maxWorkers: 1, fileParallelism: false },
});
