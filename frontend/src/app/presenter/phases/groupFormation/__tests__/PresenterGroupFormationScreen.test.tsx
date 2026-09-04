import { render, screen, within } from "@testing-library/react";
import { Phase } from "../../../../../domain/phases";
import {
  FormationSubState,
  type PresenterFormationView,
  type PresenterGroupFormationState,
  type PresenterGroups,
} from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { PresenterGroupFormationScreen } from "../PresenterGroupFormationScreen";
import { usePresenterGroupFormationScreen } from "../usePresenterGroupFormationScreen";

jest.mock("../usePresenterGroupFormationScreen", () => ({
  ...jest.requireActual("../usePresenterGroupFormationScreen"),
  usePresenterGroupFormationScreen: jest.fn(),
}));

const screenHook = usePresenterGroupFormationScreen as jest.MockedFunction<
  typeof usePresenterGroupFormationScreen
>;

const groups: PresenterGroups = [
  {
    name: { animalId: "fox", text: { de: "Fuchs", en: "Fox" } },
    memberDisplayNames: ["Ada", "Grace"],
    assignedValues: [
      { valueId: "trust", text: { de: "Vertrauen", en: "Trust" } },
    ],
  },
  {
    name: { animalId: "owl", text: { de: "Eule", en: "Owl" } },
    memberDisplayNames: ["Lin", "Mary"],
    assignedValues: [
      { valueId: "courage", text: { de: "Mut", en: "Courage" } },
    ],
  },
];

function state(
  formation: PresenterFormationView,
): PresenterGroupFormationState {
  return {
    phase: Phase.GroupFormation,
    revision: 30,
    participantCount: 4,
    selection: {
      values: [{ valueId: "trust", text: { de: "Vertrauen", en: "Trust" } }],
      submittedCount: 4,
    },
    formation,
  };
}

function renderScreen(
  formation: PresenterFormationView,
  currentPageGroups: PresenterGroups = groups,
) {
  screenHook.mockReturnValue({ pageIndex: 0, currentPageGroups });

  return render(<PresenterGroupFormationScreen state={state(formation)} />, {
    wrapper: languageWrapper(),
  });
}

const formed: PresenterFormationView = {
  subState: FormationSubState.Formed,
  groups,
};

describe("presenter group formation screen", () => {
  it("renders a card for every group on the current page", () => {
    renderScreen(formed);

    const fox = screen.getByTestId("group-card-fox");
    expect(within(fox).getByTestId("group-name")).toHaveTextContent("Fox");
    expect(
      within(fox)
        .getAllByTestId("group-member")
        .map((member) => member.textContent),
    ).toEqual(["Ada", "Grace"]);
    expect(within(fox).getByTestId("group-value-trust")).toHaveTextContent(
      "Trust",
    );
    expect(screen.getByTestId("group-card-owl")).toBeInTheDocument();
  });

  it("leaves groups beyond the current page off the wall", () => {
    renderScreen(formed, [groups[0]]);

    expect(screen.getByTestId("group-card-fox")).toBeInTheDocument();
    expect(screen.queryByTestId("group-card-owl")).not.toBeInTheDocument();
  });

  it("runs the bar at the emitted progress while the formation runs", () => {
    renderScreen({ subState: FormationSubState.Forming, progress: 0.25 }, []);

    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "25",
    );
    expect(screen.queryByTestId("group-card-fox")).not.toBeInTheDocument();
  });
});
