import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.config";

// Manual tool, never part of CI: records one workshop against the running
// compose stack, composes the film on an HTML stage and encodes it with ffmpeg
// in Docker. Run it with `pnpm demo:video`.
export default defineConfig({
  ...baseConfig,
  testDir: "./scripts/demoVideo",
  timeout: 1_800_000,
  reporter: "list",
});
