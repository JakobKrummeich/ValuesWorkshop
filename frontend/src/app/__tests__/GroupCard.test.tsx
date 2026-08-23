import { render, screen } from "@testing-library/react";
import { Language } from "../../domain/i18n/language";
import { languageWrapper } from "../../testing/languageWrapper";
import { GroupCard } from "../GroupCard";

const name = { animalId: "fox", text: { de: "Fuchs", en: "Fox" } };

const assignedValues = [
  { valueId: "trust", text: { de: "Vertrauen", en: "Trust" } },
  { valueId: "courage", text: { de: "Mut", en: "Courage" } },
  { valueId: "respect", text: { de: "Respekt", en: "Respect" } },
  { valueId: "honesty", text: { de: "Ehrlichkeit", en: "Honesty" } },
  { valueId: "openness", text: { de: "Offenheit", en: "Openness" } },
];

function renderCard(language?: Language) {
  return render(
    <GroupCard
      name={name}
      memberDisplayNames={["Ada", "Grace", "Lin"]}
      assignedValues={assignedValues}
    />,
    { wrapper: languageWrapper(language) },
  );
}

describe("group card", () => {
  it("shows the animal name in English", () => {
    renderCard();

    expect(screen.getByTestId("group-card-fox")).toBeInTheDocument();
    expect(screen.getByTestId("group-name")).toHaveTextContent("Fox");
  });

  it("shows the animal name in German", () => {
    renderCard(Language.German);

    expect(screen.getByTestId("group-name")).toHaveTextContent("Fuchs");
  });

  it("lists every member display name", () => {
    renderCard();

    const members = screen.getAllByTestId("group-member");
    expect(members.map((member) => member.textContent)).toEqual([
      "Ada",
      "Grace",
      "Lin",
    ]);
  });

  it("shows the assigned values in English", () => {
    renderCard();

    expect(screen.getByTestId("group-value-trust")).toHaveTextContent("Trust");
    expect(screen.getByTestId("group-value-courage")).toHaveTextContent(
      "Courage",
    );
  });

  it("shows the assigned values in German", () => {
    renderCard(Language.German);

    expect(screen.getByTestId("group-value-trust")).toHaveTextContent(
      "Vertrauen",
    );
  });

  it("gives every member chip one class and every value chip another", () => {
    renderCard();

    const memberClasses = screen
      .getAllByTestId("group-member")
      .map((member) => member.className);
    const valueClasses = screen
      .getAllByTestId(/^group-value-/)
      .map((value) => value.className);

    expect(new Set(memberClasses).size).toBe(1);
    expect(new Set(valueClasses).size).toBe(1);
    expect(memberClasses[0]).not.toBe(valueClasses[0]);
  });
});
