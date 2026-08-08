import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  // One worker: the session lifecycle suite restarts the shared backend container.
  workers: 1,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    // The suite asserts on visible text, so it pins the browser to English.
    locale: "en-US",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
