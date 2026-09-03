import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const appDirectory = resolve(__dirname, "..", "app");
const baseTokenFile = "tokens.css";

export interface Rgba {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

type Declarations = ReadonlyMap<string, string>;

const transparent: Rgba = { red: 0, green: 0, blue: 0, alpha: 0 };

function declarationsOf(fileName: string): Declarations {
  const source = readFileSync(resolve(appDirectory, fileName), "utf8");

  return new Map(
    [...source.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)].map(
      ([, name, value]) => [name, value.replace(/\s+/g, " ").trim()],
    ),
  );
}

function channel(hex: string): number {
  return parseInt(hex.length === 1 ? hex + hex : hex, 16);
}

function parseHex(digits: string): Rgba {
  const size = digits.length <= 4 ? 1 : 2;
  const alphaDigits = digits.slice(3 * size);

  return {
    red: channel(digits.slice(0, size)),
    green: channel(digits.slice(size, 2 * size)),
    blue: channel(digits.slice(2 * size, 3 * size)),
    alpha: alphaDigits === "" ? 1 : channel(alphaDigits) / 255,
  };
}

function parseFraction(fraction: string | undefined): number {
  if (fraction === undefined) {
    return 1;
  }

  return fraction.endsWith("%")
    ? Number(fraction.slice(0, -1)) / 100
    : Number(fraction);
}

function parseMix(inner: string): Rgba {
  const [first, second] = inner.split(",").map((part) => part.trim());
  const [firstColor, firstShare] = first.split(/\s+(?=[\d.]+%$)/);
  const [secondColor, secondShare] = second.split(/\s+(?=[\d.]+%$)/);
  const firstWeight = parseFraction(firstShare ?? "50%");
  const secondWeight =
    secondShare === undefined ? 1 - firstWeight : parseFraction(secondShare);
  const firstRgba = parseColor(firstColor);
  const secondRgba = parseColor(secondColor);
  const firstShareOfAlpha = firstRgba.alpha * firstWeight;
  const secondShareOfAlpha = secondRgba.alpha * secondWeight;
  const alpha = firstShareOfAlpha + secondShareOfAlpha;
  const mixChannel = (firstChannel: number, secondChannel: number) =>
    Math.round(
      (firstChannel * firstShareOfAlpha + secondChannel * secondShareOfAlpha) /
        alpha,
    );

  return {
    red: mixChannel(firstRgba.red, secondRgba.red),
    green: mixChannel(firstRgba.green, secondRgba.green),
    blue: mixChannel(firstRgba.blue, secondRgba.blue),
    alpha,
  };
}

export function parseColor(value: string): Rgba {
  if (value === "transparent") {
    return transparent;
  }

  const hex = /^#([0-9a-f]{3,8})$/i.exec(value);
  if (hex !== null) {
    return parseHex(hex[1]);
  }

  const rgb =
    /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*(?:[/,]\s*([\d.]+%?))?\s*\)$/i.exec(
      value,
    );
  if (rgb !== null) {
    return {
      red: Number(rgb[1]),
      green: Number(rgb[2]),
      blue: Number(rgb[3]),
      alpha: parseFraction(rgb[4]),
    };
  }

  const mix = /^color-mix\(\s*in srgb,(.+)\)$/.exec(value);
  if (mix !== null) {
    return parseMix(mix[1]);
  }

  throw new Error(`Not a colour this guard can read: ${value}`);
}

function resolveReferences(
  value: string,
  surface: Declarations,
  base: Declarations,
): string {
  return value.replace(/var\((--[a-z0-9-]+)\)/g, (unused, name: string) => {
    const referenced = surface.get(name) ?? base.get(name);
    if (referenced === undefined) {
      throw new Error(`${name} is not defined in any token file`);
    }

    return resolveReferences(referenced, surface, base);
  });
}

export function baseTokenValue(token: string): string {
  const value = declarationsOf(baseTokenFile).get(token);
  if (value === undefined) {
    throw new Error(`${baseTokenFile} does not define ${token}`);
  }

  return value;
}

export function surfaceColors(
  surfaceFileName: string,
): (token: string) => Rgba {
  const base = declarationsOf(baseTokenFile);
  const surface = declarationsOf(surfaceFileName);

  return (token) => {
    const value = surface.get(token);
    if (value === undefined) {
      throw new Error(`${surfaceFileName} does not define ${token}`);
    }

    return parseColor(resolveReferences(value, surface, base));
  };
}

function linear(channelValue: number): number {
  const scaled = channelValue / 255;

  return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
}

function luminance(color: Rgba): number {
  return (
    0.2126 * linear(color.red) +
    0.7152 * linear(color.green) +
    0.0722 * linear(color.blue)
  );
}

export function over(foreground: Rgba, background: Rgba): Rgba {
  const blend = (top: number, bottom: number) =>
    Math.round(top * foreground.alpha + bottom * (1 - foreground.alpha));

  return {
    red: blend(foreground.red, background.red),
    green: blend(foreground.green, background.green),
    blue: blend(foreground.blue, background.blue),
    alpha: 1,
  };
}

export function contrastRatio(foreground: Rgba, background: Rgba): number {
  const composited = over(foreground, background);
  const lighter = Math.max(luminance(composited), luminance(background));
  const darker = Math.min(luminance(composited), luminance(background));

  return (lighter + 0.05) / (darker + 0.05);
}
