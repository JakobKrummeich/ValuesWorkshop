import jsQR from "jsqr";
import { PNG } from "pngjs";
import type { Locator } from "@playwright/test";

export async function decodeQrCode(qrCode: Locator): Promise<string> {
  const image = PNG.sync.read(await qrCode.screenshot());
  const decoded = jsQR(
    Uint8ClampedArray.from(image.data),
    image.width,
    image.height,
  );

  if (decoded === null) {
    throw new Error("The QR code on screen could not be decoded");
  }

  return decoded.data;
}
