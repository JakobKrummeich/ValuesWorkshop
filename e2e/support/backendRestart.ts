import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { expect, type Page } from "@playwright/test";
import { isPageStillMarked, markPage } from "./pageMarker";

export const RECONNECT_TIMEOUT_MILLISECONDS = 90_000;
export const RESTART_TEST_TIMEOUT_MILLISECONDS = 180_000;

const runCommand = promisify(execFile);
const repositoryRoot = path.resolve(__dirname, "../..");

export async function restartBackend(): Promise<void> {
  await runCommand(
    "docker",
    [
      "compose",
      "-f",
      "docker-compose.dev.yml",
      "-f",
      "docker-compose.e2e.yml",
      "restart",
      "backend",
    ],
    { cwd: repositoryRoot },
  );
}

export async function restartBackendAwaitingReconnect(
  pages: readonly Page[],
): Promise<void> {
  for (const page of pages) {
    await markPage(page);
  }

  const droppedConnections = pages.map((page) =>
    page.waitForFunction(
      () =>
        document.querySelector('[data-testid="connection"]')?.textContent !==
        "Connected",
      undefined,
      { timeout: RECONNECT_TIMEOUT_MILLISECONDS },
    ),
  );

  await restartBackend();

  for (const droppedConnection of droppedConnections) {
    await droppedConnection;
  }

  for (const page of pages) {
    await expect(page.getByTestId("connection")).toHaveText("Connected", {
      timeout: RECONNECT_TIMEOUT_MILLISECONDS,
    });
    expect(await isPageStillMarked(page)).toBe(true);
  }
}
