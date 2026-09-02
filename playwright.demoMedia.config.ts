import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.config";

// Manual tool, never part of CI: drives one small workshop against the running
// compose stack and saves the README screenshots. Run it with `pnpm demo:media`.
export default defineConfig({
  ...baseConfig,
  testDir: "./scripts/demoMedia",
  timeout: 600_000,
  reporter: "list",
});
