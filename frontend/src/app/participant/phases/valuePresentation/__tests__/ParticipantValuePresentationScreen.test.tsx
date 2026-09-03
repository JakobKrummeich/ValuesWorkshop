import { render, screen } from "@testing-library/react";
import { MessageKey } from "../../../../../domain/i18n/messages";
import { Phase } from "../../../../../domain/phases";
import type { ParticipantValuePresentationState } from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { ParticipantValuePresentationScreen } from "../ParticipantValuePresentationScreen";
import { useParticipantValuePresentationScreen } from "../useParticipantValuePresentationScreen";

jest.mock("../useParticipantValuePresentationScreen", () => ({
  useParticipantValuePresentationScreen: jest.fn(),
}));

const screenHook = useParticipantValuePresentationScreen as jest.MockedFunction<
  typeof useParticipantValuePresentationScreen
>;

const state: ParticipantValuePresentationState = {
  phase: Phase.ValuePresentation,
  revision: 3,
  participantCount: 12,
  ownGroup: null,
  presentation: {
    presentingGroupName: null,
    presentedValueId: null,
    presentedActions: [],
  },
};

describe("participant value presentation screen", () => {
  it("shows the copy the hook chooses on the waiting screen", () => {
    screenHook.mockReturnValue({
      heading: MessageKey.WaitingOwnGroupUp,
      body: MessageKey.WaitingGroupPresents,
      bodyParameters: { group: "Fox", value: "Curiosity" },
    });

    render(<ParticipantValuePresentationScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screenHook).toHaveBeenCalledWith(state);
    expect(screen.getByTestId("waiting-screen")).toHaveTextContent(
      "Your group is up!",
    );
    expect(screen.getByTestId("waiting-screen")).toHaveTextContent(
      "Fox is presenting Curiosity.",
    );
  });
});
