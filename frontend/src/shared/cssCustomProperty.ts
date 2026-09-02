import type { CSSProperties } from "react";

export function cssCustomProperty(name: string, value: number): CSSProperties {
  return { [name]: value } as CSSProperties;
}

export function cssCustomProperties(
  values: Readonly<Record<string, number>>,
): CSSProperties {
  return values as CSSProperties;
}
