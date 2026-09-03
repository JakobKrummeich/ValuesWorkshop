import { act, renderHook } from "@testing-library/react";
import { motionIsAllowed } from "../../adapters/motionPreference";
import {
  motionRevealMilliseconds,
  motionStaggerMilliseconds,
} from "../../shared/motion";
import {
  revealDurationOf,
  useRevealChoreography,
} from "../useRevealChoreography";

jest.mock("../../adapters/motionPreference", () => ({
  motionIsAllowed: jest.fn(),
}));

const motionAllowed = motionIsAllowed as jest.MockedFunction<
  typeof motionIsAllowed
>;

describe("reveal choreography", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("lets the bars grow one after another before the labels appear", () => {
    motionAllowed.mockReturnValue(true);
    const { result } = renderHook(() => useRevealChoreography(20));

    expect(result.current.labelsVisible).toBe(false);

    act(() => jest.advanceTimersByTime(revealDurationOf(20) - 1));
    expect(result.current.labelsVisible).toBe(false);

    act(() => jest.advanceTimersByTime(1));
    expect(result.current.labelsVisible).toBe(true);
  });

  it("waits one stagger per row plus the reveal of the last bar", () => {
    expect(revealDurationOf(20)).toBe(
      20 * motionStaggerMilliseconds + motionRevealMilliseconds,
    );
  });

  it("shows the labels at once when motion is not allowed", () => {
    motionAllowed.mockReturnValue(false);
    const { result } = renderHook(() => useRevealChoreography(20));

    expect(result.current.labelsVisible).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("keeps the labels once shown even when rows arrive later", () => {
    motionAllowed.mockReturnValue(true);
    const { result, rerender } = renderHook(
      (rowCount: number) => useRevealChoreography(rowCount),
      { initialProps: 3 },
    );

    act(() => jest.advanceTimersByTime(revealDurationOf(3)));
    rerender(5);

    expect(result.current.labelsVisible).toBe(true);
  });

  it("drops its timer on unmount", () => {
    motionAllowed.mockReturnValue(true);
    const { unmount } = renderHook(() => useRevealChoreography(4));

    unmount();

    expect(jest.getTimerCount()).toBe(0);
  });
});
