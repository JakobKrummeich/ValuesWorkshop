import { act, renderHook } from "@testing-library/react";
import { NEVER, Subject } from "rxjs";
import { Phase } from "../../../domain/phases";
import {
  FormationSubState,
  type ParticipantWorkshopState,
} from "../../../domain/workshopState";
import { useOwnGroupMemory } from "../useOwnGroupMemory";

const otter = { animalId: "otter", text: { de: "Otter", en: "Otter" } };
const envelope = { revision: 1, participantCount: 3 };

describe("own group memory hook", () => {
  it("remembers the own group across the states the port delivers", () => {
    const workshopState = new Subject<ParticipantWorkshopState>();
    const { result } = renderHook(() =>
      useOwnGroupMemory({ workshopState, connectionState: NEVER }),
    );
    expect(result.current).toBeNull();

    act(() =>
      workshopState.next({
        ...envelope,
        phase: Phase.GroupFormation,
        formation: {
          subState: FormationSubState.Formed,
          ownGroup: { name: otter, memberDisplayNames: [], assignedValues: [] },
        },
      }),
    );
    act(() =>
      workshopState.next({
        ...envelope,
        phase: Phase.FinalPresentation,
        conclusion: { isConcluded: false },
      }),
    );

    expect(result.current).toEqual(otter);
  });

  it("stops listening when unmounted", () => {
    const workshopState = new Subject<ParticipantWorkshopState>();
    const { unmount } = renderHook(() =>
      useOwnGroupMemory({ workshopState, connectionState: NEVER }),
    );

    unmount();

    expect(workshopState.observed).toBe(false);
  });
});
