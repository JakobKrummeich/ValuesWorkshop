import { render, screen, within } from "@testing-library/react";
import { Language } from "../../../../../domain/i18n/language";
import { Phase } from "../../../../../domain/phases";
import type { FacilitatorGroupFormationState } from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { FacilitatorGroupFormationScreen } from "../FacilitatorGroupFormationScreen";

function state(): FacilitatorGroupFormationState {
  return {
    phase: Phase.GroupFormation,
    revision: 30,
    roster: {
      participants: [
        { participantId: "participant-1", displayName: "Ada" },
        { participantId: "participant-2", displayName: "Grace" },
        { participantId: "participant-3", displayName: "Lin" },
        { participantId: "participant-4", displayName: "Mary" },
      ],
      participantCount: 4,
    },
    enabledIntents: [],
    selection: {
      values: [
        { valueId: "trust", text: { de: "Vertrauen", en: "Trust" } },
        { valueId: "courage", text: { de: "Mut", en: "Courage" } },
      ],
      submittedCount: 4,
    },
    groups: [
      {
        name: { animalId: "fox", text: { de: "Fuchs", en: "Fox" } },
        members: [
          { participantId: "participant-1", displayName: "Ada" },
          { participantId: "participant-2", displayName: "Grace" },
        ],
        assignedValues: [
          { valueId: "trust", text: { de: "Vertrauen", en: "Trust" } },
        ],
      },
      {
        name: { animalId: "owl", text: { de: "Eule", en: "Owl" } },
        members: [
          { participantId: "participant-3", displayName: "Lin" },
          { participantId: "participant-4", displayName: "Mary" },
        ],
        assignedValues: [
          { valueId: "courage", text: { de: "Mut", en: "Courage" } },
        ],
      },
    ],
  };
}

describe("facilitator group formation screen", () => {
  it("lists every group with name, members, and values", () => {
    render(<FacilitatorGroupFormationScreen state={state()} />, {
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

    const owl = screen.getByTestId("group-card-owl");
    expect(within(owl).getByTestId("group-name")).toHaveTextContent("Owl");
    expect(
      within(owl)
        .getAllByTestId("group-member")
        .map((member) => member.textContent),
    ).toEqual(["Lin", "Mary"]);
    expect(within(owl).getByTestId("group-value-courage")).toHaveTextContent(
      "Courage",
    );
  });

  it("speaks German when German is chosen", () => {
    render(<FacilitatorGroupFormationScreen state={state()} />, {
      wrapper: languageWrapper(Language.German),
    });

    const fox = screen.getByTestId("group-card-fox");
    expect(within(fox).getByTestId("group-name")).toHaveTextContent("Fuchs");
    expect(within(fox).getByTestId("group-value-trust")).toHaveTextContent(
      "Vertrauen",
    );
  });
});
