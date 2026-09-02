"use client";

import { useState } from "react";

export interface ConfettiParticle {
  id: number;
  x: number;
  delay: number;
  drift: number;
  spin: number;
  hue: number;
}

export const confettiHueCount = 9;

const seed = 0x9e3779b9;

function seededRandom(initial: number): () => number {
  let state = initial;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;

    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

export function confettiParticles(count: number): ConfettiParticle[] {
  const random = seededRandom(seed);

  return Array.from({ length: count }, (unused, id) => ({
    id,
    x: Math.round(random() * 100),
    delay: Math.round(random() * 60) / 100,
    drift: Math.round((random() - 0.5) * 6),
    spin: Math.round(random() * 3 + 1),
    hue: id % confettiHueCount,
  }));
}

export function useConfetti(count: number): readonly ConfettiParticle[] {
  const [particles] = useState(() => confettiParticles(count));

  return particles;
}
