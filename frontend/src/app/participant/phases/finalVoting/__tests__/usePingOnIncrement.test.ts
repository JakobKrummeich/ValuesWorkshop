import { renderHook } from "@testing-library/react";
import { usePingOnIncrement } from "../usePingOnIncrement";

describe("ping on increment", () => {
  it("starts silent", () => {
    const { result } = renderHook(
      (count: number) => usePingOnIncrement(count),
      {
        initialProps: 0,
      },
    );

    expect(result.current).toBe(0);
  });

  it("pings once per increment", () => {
    const { result, rerender } = renderHook(
      (count: number) => usePingOnIncrement(count),
      { initialProps: 0 },
    );

    rerender(1);
    expect(result.current).toBe(1);

    rerender(2);
    expect(result.current).toBe(2);

    rerender(2);
    expect(result.current).toBe(2);
  });

  it("stays quiet when the count drops", () => {
    const { result, rerender } = renderHook(
      (count: number) => usePingOnIncrement(count),
      { initialProps: 2 },
    );

    rerender(1);
    expect(result.current).toBe(0);

    rerender(2);
    expect(result.current).toBe(1);
  });
});
