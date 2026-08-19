import { render, screen, within } from "@testing-library/react";
import { Phase } from "../../../../../domain/phases";
import type { PresenterGroupFormationState } from "../../../../../domain/workshopState";
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

const groups: PresenterGroupFormationState["groups"] = [
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

const state: PresenterGroupFormationState = {
  phase: Phase.GroupFormation,
  revision: 30,
  participantCount: 4,
  selection: {
    values: [{ valueId: "trust", text: { de: "Vertrauen", en: "Trust" } }],
    submittedCount: 4,
  },
  groups,
};

describe("presenter group formation screen", () => {
  it("renders a card for every group on the current page", () => {
    screenHook.mockReturnValue({ currentPageGroups: groups });

    render(<PresenterGroupFormationScreen state={state} />, {
      wrapper: languageWrapper(),
    });

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
    screenHook.mockReturnValue({ currentPageGroups: [groups[0]] });

    render(<PresenterGroupFormationScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("group-card-fox")).toBeInTheDocument();
    expect(screen.queryByTestId("group-card-owl")).not.toBeInTheDocument();
  });

  it("hands the wire groups to the paging hook", () => {
    screenHook.mockReturnValue({ currentPageGroups: groups });

    render(<PresenterGroupFormationScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screenHook).toHaveBeenCalledWith(groups);
  });
});
