import { render, screen } from "@testing-library/react";
import { MessageKey } from "../../../../../domain/i18n/messages";
import { Phase } from "../../../../../domain/phases";
import type { FacilitatorFinalPresentationState } from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { FacilitatorFinalPresentationScreen } from "../FacilitatorFinalPresentationScreen";
import { useFacilitatorFinalPresentationScreen } from "../useFacilitatorFinalPresentationScreen";

jest.mock("../useFacilitatorFinalPresentationScreen", () => ({
  useFacilitatorFinalPresentationScreen: jest.fn(),
}));

const screenHook = useFacilitatorFinalPresentationScreen as jest.MockedFunction<
  typeof useFacilitatorFinalPresentationScreen
>;

const state = {
  phase: Phase.FinalPresentation,
} as unknown as FacilitatorFinalPresentationState;

function model(
  overrides: Partial<
    ReturnType<typeof useFacilitatorFinalPresentationScreen>
  > = {},
): ReturnType<typeof useFacilitatorFinalPresentationScreen> {
  return {
    revealedCount: 2,
    winnerCount: 5,
    isConcluded: false,
    isRevealNextEnabled: true,
    isSending: false,
    rejectionMessage: null,
    revealNextValue: jest.fn(),
    ...overrides,
  };
}

describe("facilitator final presentation screen", () => {
  it("shows the reveal progress and an enabled reveal button", () => {
    screenHook.mockReturnValue(model());

    render(<FacilitatorFinalPresentationScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("revealed-count")).toHaveTextContent(
      "Revealed: 2 of 5",
    );
    expect(screen.getByTestId("reveal-pips").children).toHaveLength(5);
    expect(
      screen
        .getByTestId("reveal-pips")
        .querySelectorAll('[data-filled="true"]'),
    ).toHaveLength(2);
    expect(screen.getByTestId("reveal-next-button")).toBeEnabled();
    expect(screen.queryByTestId("concluded-note")).not.toBeInTheDocument();
  });

  it("disables the reveal button while the wire does not offer it", () => {
    screenHook.mockReturnValue(model({ isRevealNextEnabled: false }));

    render(<FacilitatorFinalPresentationScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("reveal-next-button")).toBeDisabled();
  });

  it("disables the reveal button while a send is in flight", () => {
    screenHook.mockReturnValue(model({ isSending: true }));

    render(<FacilitatorFinalPresentationScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("reveal-next-button")).toBeDisabled();
  });

  it("replaces the button with the concluded note once all winners are revealed", () => {
    screenHook.mockReturnValue(
      model({
        revealedCount: 5,
        isConcluded: true,
        isRevealNextEnabled: false,
      }),
    );

    render(<FacilitatorFinalPresentationScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("revealed-count")).toHaveTextContent(
      "Revealed: 5 of 5",
    );
    expect(screen.queryByTestId("reveal-next-button")).not.toBeInTheDocument();
    expect(screen.getByTestId("concluded-note")).toHaveTextContent(
      "All winners are revealed — the workshop is concluded.",
    );
  });

  it("shows the rejection message the hook reports", () => {
    screenHook.mockReturnValue(
      model({ rejectionMessage: MessageKey.IntentWrongPhase }),
    );

    render(<FacilitatorFinalPresentationScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      "That is not possible in this phase.",
    );
  });
});
