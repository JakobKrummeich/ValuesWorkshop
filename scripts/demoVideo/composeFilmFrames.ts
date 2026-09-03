import type { Browser, Page } from "@playwright/test";
import { resolve } from "node:path";
import {
  FILM_DIRECTORY,
  frameFileName,
  FRAMES_DIRECTORY,
  PRODUCT_ASSET_DIRECTORY,
  STAGE_DIRECTORY,
} from "./filmWorkspace";
import type { StageFrame } from "./planFilmFrames";
import type { FilmDevice } from "./sceneTimeline";
import { WALL_VIEWPORT } from "../../e2e/support/viewports";

const STAGE_ORIGIN = "http://demo.film";
const STAGE_URL = `${STAGE_ORIGIN}/stage/stage.html`;
const JPEG_QUALITY = 92;
const PROGRESS_FRAME_INTERVAL = 150;

const DIRECTORY_BY_URL_PREFIX: Record<string, string> = {
  "/stage/": STAGE_DIRECTORY,
  "/product/": PRODUCT_ASSET_DIRECTORY,
  "/frames/": FRAMES_DIRECTORY,
};

const IMAGE_ELEMENT_ID_BY_DEVICE: Record<FilmDevice, string> = {
  wall: "wallImage",
  phone: "phoneImage",
  laptop: "laptopImage",
};

type StagePayload = {
  layout: string;
  eyebrow: string;
  caption: string;
  captionEnter: number;
  filmProgress: number;
  imageUrlsByElementId: Record<string, string>;
};

export async function composeFilmFrames(
  browser: Browser,
  frames: readonly StageFrame[],
): Promise<void> {
  const context = await browser.newContext({
    viewport: WALL_VIEWPORT,
    deviceScaleFactor: 1,
  });
  try {
    const page = await context.newPage();
    await serveWorkspaceFiles(page);
    await page.goto(STAGE_URL);
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    for (const [index, frame] of frames.entries()) {
      await page.evaluate(applyStageFrame, payloadOf(frame));
      await page.screenshot({
        path: resolve(FILM_DIRECTORY, frameFileName(index + 1)),
        type: "jpeg",
        quality: JPEG_QUALITY,
      });
      if ((index + 1) % PROGRESS_FRAME_INTERVAL === 0) {
        console.log(`composed ${index + 1} of ${frames.length} film frames`);
      }
    }
  } finally {
    await context.close();
  }
}

async function serveWorkspaceFiles(page: Page): Promise<void> {
  await page.route(`${STAGE_ORIGIN}/**`, async (route) => {
    const { pathname } = new URL(route.request().url());
    const prefix = Object.keys(DIRECTORY_BY_URL_PREFIX).find((candidate) =>
      pathname.startsWith(candidate),
    );
    if (prefix === undefined) {
      await route.fulfill({ status: 404, body: `no route for ${pathname}` });
      return;
    }
    await route.fulfill({
      path: resolve(
        DIRECTORY_BY_URL_PREFIX[prefix],
        pathname.slice(prefix.length),
      ),
    });
  });
}

function payloadOf(frame: StageFrame): StagePayload {
  const imageUrlsByElementId: Record<string, string> = {};
  for (const [device, frameUrl] of Object.entries(frame.frameUrlsByDevice)) {
    imageUrlsByElementId[IMAGE_ELEMENT_ID_BY_DEVICE[device as FilmDevice]] =
      frameUrl;
  }
  return {
    layout: frame.layout,
    eyebrow: frame.eyebrow,
    caption: frame.caption,
    captionEnter: frame.captionEnter,
    filmProgress: frame.filmProgress,
    imageUrlsByElementId,
  };
}

async function applyStageFrame(payload: StagePayload): Promise<void> {
  const elementById = (elementId: string): HTMLElement => {
    const element = document.getElementById(elementId);
    if (element === null) {
      throw new Error(`The stage has no element "${elementId}"`);
    }
    return element;
  };

  document.body.dataset.layout = payload.layout;
  elementById("eyebrow").textContent = payload.eyebrow;
  elementById("caption").textContent = payload.caption;
  document.body.style.setProperty("--caption-enter", `${payload.captionEnter}`);
  document.body.style.setProperty("--film-progress", `${payload.filmProgress}`);

  const decoded: Promise<void>[] = [];
  for (const [elementId, imageUrl] of Object.entries(
    payload.imageUrlsByElementId,
  )) {
    const image = elementById(elementId) as HTMLImageElement;
    if (image.getAttribute("src") !== imageUrl) {
      image.setAttribute("src", imageUrl);
    }
    decoded.push(image.decode());
  }
  await Promise.all(decoded);
}
