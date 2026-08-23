import { render, screen } from "@testing-library/react";
import { Language } from "../../../../../domain/i18n/language";
import { Phase } from "../../../../../domain/phases";
import {
  FormationSubState,
  type ParticipantFormationView,
  type ParticipantGroupFormationState,
} from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { ParticipantGroupFormationScreen } from "../ParticipantGroupFormationScreen";

const ownGroup = {
  name: { animalId: "fox", text: { de: "Fuchs", en: "Fox" } },
  memberDisplayNames: ["Ada", "Grace", "Lin"],
  assignedValues: [
    { valueId: "trust", text: { de: "Vertrauen", en: "Trust" } },
    { valueId: "courage", text: { de: "Mut", en: "Courage" } },
  ],
};

function formed(
  group: typeof ownGroup | null = ownGroup,
): ParticipantFormationView {
  return { subState: FormationSubState.Formed, ownGroup: group };
}

function renderScreen(
  formation: ParticipantFormationView,
  language = Language.English,
) {
  const state: ParticipantGroupFormationState = {
    phase: Phase.GroupFormation,
    revision: 30,
    participantCount: 3,
    formation,
  };

  return render(<ParticipantGroupFormationScreen state={state} />, {
    wrapper: languageWrapper(language),
  });
}

describe("participant group formation screen", () => {
  it("shows the own group card with name, members, and values", () => {
    renderScreen(formed());

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
    renderScreen(formed(), Language.German);

    expect(screen.getByTestId("group-name")).toHaveTextContent("Fuchs");
    expect(screen.getByTestId("group-value-trust")).toHaveTextContent(
      "Vertrauen",
    );
  });

  it("notes that the group is being formed while no group is assigned", () => {
    renderScreen(formed(null));

    expect(screen.queryByTestId("own-group-card")).not.toBeInTheDocument();
    expect(screen.getByTestId("own-group-waiting")).toHaveTextContent(
      "Your group is being formed\u2026",
    );
  });

  it("notes the forming group in German when German is chosen", () => {
    renderScreen(formed(null), Language.German);

    expect(screen.getByTestId("own-group-waiting")).toHaveTextContent(
      "Deine Gruppe wird gerade gebildet\u2026",
    );
  });

  it("runs the bar at the emitted progress while the formation runs", () => {
    renderScreen({ subState: FormationSubState.Forming, progress: 0.6 });

    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "60",
    );
    expect(screen.queryByTestId("own-group-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("own-group-waiting")).not.toBeInTheDocument();
  });
});
