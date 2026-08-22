import { act, render, screen } from "@testing-library/react";
import { Language } from "../../../../../domain/i18n/language";
import { formationProgressMilliseconds } from "../../../../useFormationProgressBar";
import { Phase } from "../../../../../domain/phases";
import type { ParticipantGroupFormationState } from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { ParticipantGroupFormationScreen } from "../ParticipantGroupFormationScreen";
import { useParticipantGroupFormationScreen } from "../useParticipantGroupFormationScreen";

jest.mock("../useParticipantGroupFormationScreen", () => ({
  useParticipantGroupFormationScreen: jest.fn(),
}));

const screenHook = useParticipantGroupFormationScreen as jest.MockedFunction<
  typeof useParticipantGroupFormationScreen
>;

const completeFormationProgress = jest.fn();

beforeEach(() => {
  completeFormationProgress.mockClear();
  screenHook.mockReturnValue({
    isFormationProgressRunning: false,
    completeFormationProgress,
  });
});

function state(
  ownGroup: ParticipantGroupFormationState["ownGroup"],
): ParticipantGroupFormationState {
  return {
    phase: Phase.GroupFormation,
    revision: 30,
    participantCount: 3,
    ownGroup,
  };
}

const ownGroup: NonNullable<ParticipantGroupFormationState["ownGroup"]> = {
  name: { animalId: "fox", text: { de: "Fuchs", en: "Fox" } },
  memberDisplayNames: ["Ada", "Grace", "Lin"],
  assignedValues: [
    { valueId: "trust", text: { de: "Vertrauen", en: "Trust" } },
    { valueId: "courage", text: { de: "Mut", en: "Courage" } },
  ],
};

describe("participant group formation screen", () => {
  it("shows the own group card with name, members, and values", () => {
    render(
      <ParticipantGroupFormationScreen
        state={state(ownGroup)}
        isPhaseEntryObserved={false}
      />,
      { wrapper: languageWrapper() },
    );

    expect(screen.getByTestId("own-group-card")).toBeInTheDocument();
    expect(screen.getByTestId("group-name")).toHaveTextContent("Fox");
    expect(
      screen.getAllByTestId("group-member").map((member) => member.textContent),
    ).toEqual(["Ada", "Grace", "Lin"]);
    expect(screen.getByTestId("group-value-trust")).toHaveTextContent("Trust");
    expect(screen.getByTestId("group-value-courage")).toHaveTextContent(
      "Courage",
    );
  });

  it("speaks German when German is chosen", () => {
    render(
      <ParticipantGroupFormationScreen
        state={state(ownGroup)}
        isPhaseEntryObserved={false}
      />,
      { wrapper: languageWrapper(Language.German) },
    );

    expect(screen.getByTestId("group-name")).toHaveTextContent("Fuchs");
    expect(screen.getByTestId("group-value-trust")).toHaveTextContent(
      "Vertrauen",
    );
  });

  it("notes that the group is being formed while no group is assigned", () => {
    render(
      <ParticipantGroupFormationScreen
        state={state(null)}
        isPhaseEntryObserved={false}
      />,
      { wrapper: languageWrapper() },
    );

    expect(screen.queryByTestId("own-group-card")).not.toBeInTheDocument();
    expect(screen.getByTestId("own-group-waiting")).toHaveTextContent(
      "Your group is being formed\u2026",
    );
  });

  it("notes the forming group in German when German is chosen", () => {
    render(
      <ParticipantGroupFormationScreen
        state={state(null)}
        isPhaseEntryObserved={false}
      />,
      { wrapper: languageWrapper(Language.German) },
    );

    expect(screen.getByTestId("own-group-waiting")).toHaveTextContent(
      "Deine Gruppe wird gerade gebildet\u2026",
    );
  });

  it("hands the observed entry to the screen hook", () => {
    render(
      <ParticipantGroupFormationScreen
        state={state(ownGroup)}
        isPhaseEntryObserved
      />,
      { wrapper: languageWrapper() },
    );

    expect(screenHook).toHaveBeenCalledWith(true);
  });

  it("holds the group card back while the progress bar runs", () => {
    screenHook.mockReturnValue({
      isFormationProgressRunning: true,
      completeFormationProgress,
    });

    render(
      <ParticipantGroupFormationScreen
        state={state(ownGroup)}
        isPhaseEntryObserved
      />,
      { wrapper: languageWrapper() },
    );

    expect(screen.getByTestId("formation-progress")).toBeInTheDocument();
    expect(screen.queryByTestId("own-group-card")).not.toBeInTheDocument();
  });

  it("reports the finished progress bar back to the screen hook", () => {
    jest.useFakeTimers();
    screenHook.mockReturnValue({
      isFormationProgressRunning: true,
      completeFormationProgress,
    });

    render(
      <ParticipantGroupFormationScreen
        state={state(ownGroup)}
        isPhaseEntryObserved
      />,
      { wrapper: languageWrapper() },
    );
    act(() => jest.advanceTimersByTime(formationProgressMilliseconds));

    expect(completeFormationProgress).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });
});
