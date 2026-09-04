import { actionSlabScaleOf } from "../actionSlabScale";

function texts(count: number, length: number): string[] {
  return Array.from({ length: count }, () => "x".repeat(length));
}

describe("action slab scale", () => {
  it("keeps a handful of short actions at full size", () => {
    expect(actionSlabScaleOf(texts(3, 30))).toBe(1);
  });

  it("keeps a single long action at full size", () => {
    expect(actionSlabScaleOf(texts(1, 200))).toBe(1);
  });

  it("shrinks five medium actions only a little", () => {
    const scale = actionSlabScaleOf(texts(5, 60));

    expect(scale).toBeLessThan(1);
    expect(scale).toBeGreaterThanOrEqual(0.7);
  });

  it("shrinks more text further", () => {
    expect(actionSlabScaleOf(texts(5, 120))).toBeLessThan(
      actionSlabScaleOf(texts(5, 60)),
    );
  });

  it("shrinks five maximal-length actions well below full size", () => {
    const scale = actionSlabScaleOf(texts(5, 199));

    expect(scale).toBeLessThanOrEqual(0.5);
    expect(scale).toBeGreaterThanOrEqual(0.4);
  });

  it("never shrinks below the smallest readable scale", () => {
    expect(actionSlabScaleOf(texts(40, 200))).toBe(0.4);
  });

  it("is full size without actions", () => {
    expect(actionSlabScaleOf([])).toBe(1);
  });
});
