import { fireEvent, render, screen } from "@testing-library/react";
import { MessageKey } from "../../../../../domain/i18n/messages";
import { Phase } from "../../../../../domain/phases";
import type { ParticipantFinalPresentationState } from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { ParticipantFinalPresentationScreen } from "../ParticipantFinalPresentationScreen";
import { useParticipantFinalPresentationScreen } from "../useParticipantFinalPresentationScreen";

jest.mock("../useParticipantFinalPresentationScreen", () => ({
  useParticipantFinalPresentationScreen: jest.fn(),
}));

const screenHook = useParticipantFinalPresentationScreen as jest.MockedFunction<
  typeof useParticipantFinalPresentationScreen
>;

const state = {
  phase: Phase.FinalPresentation,
  revision: 1,
  participantCount: 4,
  conclusion: { isConcluded: false },
} as unknown as ParticipantFinalPresentationState;

function concludedModel(
  overrides: Partial<{
    ownAnimalId: string | null;
    isDownloading: boolean;
    downloadFailedMessage: MessageKey | null;
    downloadRecord: () => void;
  }> = {},
) {
  return {
    isConcluded: true as const,
    ownAnimalId: null,
    isDownloading: false,
    downloadFailedMessage: null,
    downloadRecord: jest.fn(),
    ...overrides,
  };
}

describe("participant final presentation screen", () => {
  it("shows the waiting screen while winners are being revealed", () => {
    screenHook.mockReturnValue({ isConcluded: false });

    render(<ParticipantFinalPresentationScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("waiting-screen")).toBeInTheDocument();
    expect(
      screen.queryByTestId("download-record-button"),
    ).not.toBeInTheDocument();
  });

  it("celebrates the conclusion with a download action", () => {
    screenHook.mockReturnValue(concludedModel());

    render(<ParticipantFinalPresentationScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("workshop-concluded")).toHaveTextContent(
      "Workshop concluded",
    );
    expect(screen.getByTestId("workshop-concluded")).toHaveTextContent(
      "Thanks for taking part!",
    );
    expect(screen.getByTestId("download-record-button")).toHaveTextContent(
      "Download workshop record (PDF)",
    );
    expect(screen.queryByTestId("waiting-screen")).not.toBeInTheDocument();
  });

  it("blooms the own group's glyph in its hue with confetti", () => {
    screenHook.mockReturnValue(concludedModel({ ownAnimalId: "fuchs" }));

    const { container } = render(
      <ParticipantFinalPresentationScreen state={state} />,
      { wrapper: languageWrapper() },
    );

    expect(screen.getByTestId("workshop-concluded")).toHaveAttribute(
      "data-animal",
      "fuchs",
    );
    expect(
      screen.getByTestId("conclusion-glyph").querySelector("svg"),
    ).toHaveAttribute("viewBox", "0 0 32 32");
    expect(container.querySelectorAll("[data-hue]").length).toBeGreaterThan(0);
  });

  it("falls back to the brand mark when the own group is unknown", () => {
    screenHook.mockReturnValue(concludedModel());

    render(<ParticipantFinalPresentationScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("workshop-concluded")).not.toHaveAttribute(
      "data-animal",
    );
    expect(
      screen.getByTestId("conclusion-glyph").querySelector("svg"),
    ).toHaveAttribute("viewBox", "0 0 24 24");
  });

  it("starts the download on click", () => {
    const model = concludedModel();
    screenHook.mockReturnValue(model);

    render(<ParticipantFinalPresentationScreen state={state} />, {
      wrapper: languageWrapper(),
    });
    fireEvent.click(screen.getByTestId("download-record-button"));

    expect(model.downloadRecord).toHaveBeenCalledTimes(1);
  });

  it("disables the download while a render is in flight", () => {
    screenHook.mockReturnValue(concludedModel({ isDownloading: true }));

    render(<ParticipantFinalPresentationScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("download-record-button")).toBeDisabled();
  });

  it("shows the failure message the hook reports", () => {
    screenHook.mockReturnValue(
      concludedModel({
        downloadFailedMessage: MessageKey.FinalPresentationDownloadFailed,
      }),
    );

    render(<ParticipantFinalPresentationScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      "The download failed — please try again.",
    );
  });
});
