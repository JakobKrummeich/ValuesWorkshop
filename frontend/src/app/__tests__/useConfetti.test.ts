import { renderHook } from "@testing-library/react";
import {
  confettiHueCount,
  confettiParticles,
  useConfetti,
} from "../useConfetti";

describe("confetti particles", () => {
  it("are the same burst every time so a screen is reproducible", () => {
    expect(confettiParticles(60)).toEqual(confettiParticles(60));
  });

  it("spread across the width, start within the first moments and cover every hue", () => {
    const particles = confettiParticles(60);

    expect(particles).toHaveLength(60);
    expect(new Set(particles.map((particle) => particle.id)).size).toBe(60);
    expect(
      new Set(particles.map((particle) => particle.x)).size,
    ).toBeGreaterThan(30);
    for (const particle of particles) {
      expect(particle.x).toBeGreaterThanOrEqual(0);
      expect(particle.x).toBeLessThanOrEqual(100);
      expect(particle.delay).toBeGreaterThanOrEqual(0);
      expect(particle.delay).toBeLessThanOrEqual(0.6);
      expect(Math.abs(particle.drift)).toBeLessThanOrEqual(3);
      expect(particle.spin).toBeGreaterThanOrEqual(1);
      expect(particle.spin).toBeLessThanOrEqual(4);
    }
    expect(new Set(particles.map((particle) => particle.hue))).toEqual(
      new Set(Array.from({ length: confettiHueCount }, (unused, hue) => hue)),
    );
  });

  it("are generated once per mount", () => {
    const { result, rerender } = renderHook(() => useConfetti(12));
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
    expect(first).toHaveLength(12);
  });
});
