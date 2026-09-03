import { act, renderHook } from "@testing-library/react";
import { MessageKey } from "../../../../../domain/i18n/messages";
import { Phase } from "../../../../../domain/phases";
import type {
  PresenterFinalPresentationState,
  WinnerWithActions,
} from "../../../../../domain/workshopState";
import {
  FinalPresentationStage,
  usePresenterFinalPresentationScreen,
} from "../usePresenterFinalPresentationScreen";

function winner(
  place: number,
  overrides: Partial<WinnerWithActions> = {},
): WinnerWithActions {
  return {
    valueId: `wert-${place}`,
    text: { de: `Wert ${place}`, en: `Value ${place}` },
    place,
    voteCount: 10 - place,
    actions: [`Action for value ${place}`],
    ...overrides,
  };
}

function presentationState(
  revealedWinners: WinnerWithActions[],
  isConcluded = false,
): PresenterFinalPresentationState {
  return {
    phase: Phase.FinalPresentation,
    revision: 7,
    participantCount: 30,
    conclusion: { revealedWinners, isConcluded },
  };
}

function stubMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({ matches, media: query }),
  });
}

function allWinners(): WinnerWithActions[] {
  return [winner(5), winner(4), winner(3), winner(2), winner(1)];
}

describe("final winner interlude", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    delete (window as { matchMedia?: unknown }).matchMedia;
  });

  it("holds the place-one reveal before the overview when the conclusion arrives", () => {
    const { result, rerender } = renderHook(
      (state: PresenterFinalPresentationState) =>
        usePresenterFinalPresentationScreen(state),
      {
        initialProps: presentationState([
          winner(5),
          winner(4),
          winner(3),
          winner(2),
        ]),
      },
    );

    rerender(presentationState(allWinners(), true));

    expect(result.current).toMatchObject({
      stage: FinalPresentationStage.Reveal,
      winner: { place: 1 },
    });

    act(() => {
      jest.advanceTimersByTime(12_000);
    });

    expect(result.current).toMatchObject({
      stage: FinalPresentationStage.Overview,
    });
  });

  it("shows the overview immediately when mounted after the conclusion", () => {
    const { result } = renderHook(() =>
      usePresenterFinalPresentationScreen(
        presentationState(allWinners(), true),
      ),
    );

    expect(result.current).toMatchObject({
      stage: FinalPresentationStage.Overview,
    });
  });

  it("holds the place-one reveal even when the viewer prefers reduced motion", () => {
    stubMatchMedia(true);

    const { result, rerender } = renderHook(
      (state: PresenterFinalPresentationState) =>
        usePresenterFinalPresentationScreen(state),
      {
        initialProps: presentationState([
          winner(5),
          winner(4),
          winner(3),
          winner(2),
        ]),
      },
    );

    rerender(presentationState(allWinners(), true));

    expect(result.current).toMatchObject({
      stage: FinalPresentationStage.Reveal,
      winner: { place: 1 },
    });
  });
});

describe("presenter final presentation screen logic", () => {
  it("builds anticipation before the first reveal", () => {
    const { result } = renderHook(() =>
      usePresenterFinalPresentationScreen(presentationState([])),
    );

    expect(result.current).toEqual({
      stage: FinalPresentationStage.Anticipation,
    });
  });

  it("presents the latest revealed winner during the reveal", () => {
    const { result } = renderHook(() =>
      usePresenterFinalPresentationScreen(
        presentationState([winner(5), winner(4)]),
      ),
    );

    expect(result.current).toEqual({
      stage: FinalPresentationStage.Reveal,
      winner: {
        valueId: "wert-4",
        text: { de: "Wert 4", en: "Value 4" },
        place: 4,
        voteCount: 6,
        voteCountKey: MessageKey.FinalPresentationVoteCount,
        actions: ["Action for value 4"],
      },
    });
  });

  it("announces a single vote in the singular", () => {
    const { result } = renderHook(() =>
      usePresenterFinalPresentationScreen(
        presentationState([winner(5, { voteCount: 1 })]),
      ),
    );

    expect(result.current).toMatchObject({
      stage: FinalPresentationStage.Reveal,
      winner: {
        voteCount: 1,
        voteCountKey: MessageKey.FinalPresentationVoteCountSingle,
      },
    });
  });

  it("ranks the overview into a podium and runners-up once concluded", () => {
    const { result } = renderHook(() =>
      usePresenterFinalPresentationScreen(
        presentationState(
          [winner(5), winner(4), winner(3), winner(2), winner(1)],
          true,
        ),
      ),
    );

    expect(result.current.stage).toBe(FinalPresentationStage.Overview);
    if (result.current.stage !== FinalPresentationStage.Overview) {
      return;
    }
    expect(result.current.podium.map(({ place }) => place)).toEqual([1, 2, 3]);
    expect(result.current.runnersUp.map(({ place }) => place)).toEqual([4, 5]);
  });

  it("fills the podium alone when fewer than four values won", () => {
    const { result } = renderHook(() =>
      usePresenterFinalPresentationScreen(
        presentationState([winner(2), winner(1)], true),
      ),
    );

    expect(result.current).toEqual({
      stage: FinalPresentationStage.Overview,
      podium: [
        expect.objectContaining({ place: 1 }),
        expect.objectContaining({ place: 2 }),
      ],
      runnersUp: [],
    });
  });

  it("leaves the wire's reveal order untouched while ranking the overview", () => {
    const state = presentationState([winner(5), winner(4)], true);

    renderHook(() => usePresenterFinalPresentationScreen(state));

    expect(state.conclusion.revealedWinners.map(({ place }) => place)).toEqual([
      5, 4,
    ]);
  });
});
