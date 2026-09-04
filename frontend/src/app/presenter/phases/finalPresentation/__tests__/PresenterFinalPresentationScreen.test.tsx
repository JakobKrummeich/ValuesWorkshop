import { render, screen, within } from "@testing-library/react";
import { MessageKey } from "../../../../../domain/i18n/messages";
import { Phase } from "../../../../../domain/phases";
import type { PresenterFinalPresentationState } from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { PresenterFinalPresentationScreen } from "../PresenterFinalPresentationScreen";
import {
  FinalPresentationStage,
  usePresenterFinalPresentationScreen,
  type RevealedWinnerModel,
} from "../usePresenterFinalPresentationScreen";
import { useRevealCelebration } from "../useRevealCelebration";

jest.mock("../usePresenterFinalPresentationScreen", () => ({
  ...jest.requireActual("../usePresenterFinalPresentationScreen"),
  usePresenterFinalPresentationScreen: jest.fn(),
}));
jest.mock("../useRevealCelebration", () => ({
  useRevealCelebration: jest.fn(),
}));

const screenHook = usePresenterFinalPresentationScreen as jest.MockedFunction<
  typeof usePresenterFinalPresentationScreen
>;
const celebration = useRevealCelebration as jest.MockedFunction<
  typeof useRevealCelebration
>;

const state = {
  phase: Phase.FinalPresentation,
} as unknown as PresenterFinalPresentationState;

beforeEach(() => {
  celebration.mockReturnValue(false);
});

function revealedWinner(
  place: number,
  overrides: Partial<RevealedWinnerModel> = {},
): RevealedWinnerModel {
  return {
    valueId: `wert-${place}`,
    text: { de: `Wert ${place}`, en: `Value ${place}` },
    place,
    voteCount: 10 - place,
    voteCountKey: MessageKey.FinalPresentationVoteCount,
    actions: [`Action for value ${place}`],
    ...overrides,
  };
}

describe("presenter final presentation screen", () => {
  it("builds anticipation before the first reveal", () => {
    screenHook.mockReturnValue({
      stage: FinalPresentationStage.Anticipation,
    });

    render(<PresenterFinalPresentationScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("reveal-anticipation")).toHaveTextContent(
      "And the winners are …",
    );
  });

  it("stages the revealed winner with place, name, votes and actions", () => {
    screenHook.mockReturnValue({
      stage: FinalPresentationStage.Reveal,
      winner: revealedWinner(4, {
        actions: ["We ask before we assume", "We decide in the room"],
      }),
    });

    render(<PresenterFinalPresentationScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("winner-place")).toHaveTextContent(/^Place 4$/);
    expect(screen.getByTestId("winner-value")).toHaveTextContent("Value 4");
    expect(screen.getByTestId("winner-vote-count")).toHaveTextContent(
      /^6 votes$/,
    );
    expect(screen.getByTestId("winner-reveal")).toHaveTextContent(/^4/);
    expect(
      screen
        .getAllByTestId("winner-action")
        .map((action) => action.textContent),
    ).toEqual(["We ask before we assume", "We decide in the room"]);
    expect(screen.getAllByTestId("winner-action")[1]).toHaveStyle({
      "--index": "1",
    });
  });

  it("bursts confetti while the celebration hook says so", () => {
    celebration.mockReturnValue(true);
    screenHook.mockReturnValue({
      stage: FinalPresentationStage.Reveal,
      winner: revealedWinner(1, { actions: ["a", "b", "c"] }),
    });

    const { container } = render(
      <PresenterFinalPresentationScreen state={state} />,
      { wrapper: languageWrapper() },
    );

    expect(celebration).toHaveBeenCalledWith(3);
    expect(container.querySelectorAll("[data-hue]").length).toBeGreaterThan(0);
  });

  it("holds the confetti back until the celebration hook allows it", () => {
    screenHook.mockReturnValue({
      stage: FinalPresentationStage.Reveal,
      winner: revealedWinner(1),
    });

    const { container } = render(
      <PresenterFinalPresentationScreen state={state} />,
      { wrapper: languageWrapper() },
    );

    expect(container.querySelectorAll("[data-hue]")).toHaveLength(0);
  });

  it("hides the action list for a winner without actions", () => {
    screenHook.mockReturnValue({
      stage: FinalPresentationStage.Reveal,
      winner: revealedWinner(5, { actions: [] }),
    });

    render(<PresenterFinalPresentationScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.queryByTestId("winner-actions")).not.toBeInTheDocument();
  });

  it("lists the podium and the runners-up in place order once concluded", () => {
    screenHook.mockReturnValue({
      stage: FinalPresentationStage.Overview,
      podium: [1, 2, 3].map((place) => revealedWinner(place)),
      runnersUp: [4, 5].map((place) => revealedWinner(place)),
    });

    render(<PresenterFinalPresentationScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("winner-overview")).toHaveTextContent(
      "The winners",
    );
    const rows = screen.getAllByTestId(/overview-winner-/);
    expect(rows.map((row) => row.getAttribute("data-testid"))).toEqual([
      "overview-winner-1",
      "overview-winner-2",
      "overview-winner-3",
      "overview-winner-4",
      "overview-winner-5",
    ]);
    expect(rows[0]).toHaveAttribute("data-place", "1");
    expect(within(rows[0]).getByText("Value 1")).toBeInTheDocument();
    expect(within(rows[0]).getByText("9 votes")).toBeInTheDocument();
    expect(within(rows[4]).getByText("Value 5")).toBeInTheDocument();
    expect(within(rows[4]).getByText("5 votes")).toBeInTheDocument();
  });

  it("shows the podium alone without runners-up", () => {
    screenHook.mockReturnValue({
      stage: FinalPresentationStage.Overview,
      podium: [1, 2].map((place) => revealedWinner(place)),
      runnersUp: [],
    });

    render(<PresenterFinalPresentationScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getAllByTestId(/overview-winner-/)).toHaveLength(2);
  });
});
