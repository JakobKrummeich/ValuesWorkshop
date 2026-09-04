import { renderHook } from "@testing-library/react";
import { Phase } from "../../../../../domain/phases";
import type { PresenterSelectionState } from "../../../../../domain/workshopState";
import { presenterSelectionScreenModelOf } from "../presenterSelectionScreenModel";

function state(
  submittedCount: number,
  participantCount: number,
): PresenterSelectionState {
  return {
    phase: Phase.ValueSelection,
    revision: 11,
    participantCount,
    selection: { values: [], submittedCount },
  };
}

describe("presenter selection screen logic", () => {
  it("relates the submissions to the participants", () => {
    const { result } = renderHook(() =>
      presenterSelectionScreenModelOf(state(21, 30)),
    );

    expect(result.current).toEqual({
      submittedCount: 21,
      participantCount: 30,
      progressFraction: 0.7,
    });
  });

  it("shows no progress while nobody is in the room", () => {
    const { result } = renderHook(() =>
      presenterSelectionScreenModelOf(state(0, 0)),
    );

    expect(result.current.progressFraction).toBe(0);
  });

  it("never runs past a full bar", () => {
    const { result } = renderHook(() =>
      presenterSelectionScreenModelOf(state(4, 3)),
    );

    expect(result.current.progressFraction).toBe(1);
  });
});
