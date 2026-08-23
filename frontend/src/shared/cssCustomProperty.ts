import type { CSSProperties } from "react";

export function cssCustomProperty(name: string, value: number): CSSProperties {
  return { [name]: value } as CSSProperties;
}
