import { renderHook, act } from "@testing-library/react";
import { Subject } from "rxjs";
import { currentSessionIdentity } from "../../../adapters/browserLocation";
import { ConnectionState } from "../../../domain/connectionState";
import { Language } from "../../../domain/i18n/language";
import { Phase } from "../../../domain/phases";
import type { FacilitatorWorkshopState } from "../../../domain/workshopState";
import { languageWrapper } from "../../../testing/languageWrapper";
import { useFacilitatorShell } from "../useFacilitatorShell";

jest.mock("../../../adapters/browserLocation", () => ({
  currentSessionIdentity: jest.fn(),
}));

const sessionIdentity = currentSessionIdentity as jest.MockedFunction<
  typeof currentSessionIdentity
>;

function fakePort() {
  const workshopState = new Subject<FacilitatorWorkshopState>();
  const connectionState = new Subject<ConnectionState>();

  return {
    port: { workshopState, connectionState },
    workshopState,
    connectionState,
  };
}

function joinState(participantCount: number): FacilitatorWorkshopState {
  return {
    phase: Phase.Join,
    revision: 1,
    roster: { participants: [], participantCount },
    enabledIntents: [],
  };
}

beforeEach(() => {
  sessionIdentity.mockReturnValue("3f2a9c1b-7d4e-4a1b-9c2d-1e2f3a4b5c6d");
});

describe("facilitator shell", () => {
  it("waits for the workshop before any state has arrived", () => {
    const { port } = fakePort();

    const { result } = renderHook(() => useFacilitatorShell(port), {
      wrapper: languageWrapper(),
    });

    expect(result.current).toEqual({
      phase: null,
      heading: "Facilitator",
      title: "Waiting for the workshop…",
      sessionCodeLabel: "Session",
      sessionCode: "3f2a9c1b",
      participantsLabel: "Participants",
      participantCount: "–",
    });
  });

  it("titles the screen with the current phase name", () => {
    const { port, workshopState } = fakePort();
    const { result } = renderHook(() => useFacilitatorShell(port), {
      wrapper: languageWrapper(),
    });

    act(() => workshopState.next(joinState(12)));

    expect(result.current.phase).toBe(Phase.Join);
    expect(result.current.title).toBe("Join");
    expect(result.current.participantCount).toBe("12");
  });

  it("has no session code while the link carries no session", () => {
    sessionIdentity.mockReturnValue(null);
    const { port } = fakePort();

    const { result } = renderHook(() => useFacilitatorShell(port), {
      wrapper: languageWrapper(),
    });

    expect(result.current.sessionCode).toBeNull();
  });

  it("speaks the chosen language", () => {
    const { port, workshopState } = fakePort();
    const { result } = renderHook(() => useFacilitatorShell(port), {
      wrapper: languageWrapper(Language.German),
    });

    act(() => workshopState.next(joinState(3)));

    expect(result.current.heading).toBe("Moderation");
    expect(result.current.title).toBe("Ankommen");
    expect(result.current.sessionCodeLabel).toBe("Workshop");
    expect(result.current.participantsLabel).toBe("Teilnehmende");
  });
});
