import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/ai.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "node18",
  // Framework deps are peers; never bundle them.
  external: ["ai", "zod"],
});
