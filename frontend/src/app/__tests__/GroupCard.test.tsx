import { render, screen } from "@testing-library/react";
import { Language } from "../../domain/i18n/language";
import { languageWrapper } from "../../testing/languageWrapper";
import { GroupCard, GroupCardVariant } from "../GroupCard";

const name = { animalId: "fuchs", text: { de: "Fuchs", en: "Fox" } };

const assignedValues = [
  { valueId: "trust", text: { de: "Vertrauen", en: "Trust" } },
  { valueId: "courage", text: { de: "Mut", en: "Courage" } },
  { valueId: "respect", text: { de: "Respekt", en: "Respect" } },
  { valueId: "honesty", text: { de: "Ehrlichkeit", en: "Honesty" } },
  { valueId: "openness", text: { de: "Offenheit", en: "Openness" } },
];

function renderCard(
  language?: Language,
  extra: { status?: React.ReactNode; index?: number } = {},
) {
  return render(
    <GroupCard
      name={name}
      memberDisplayNames={["Ada", "Grace", "Lin"]}
      assignedValues={assignedValues}
      variant={GroupCardVariant.Wall}
      {...extra}
    />,
    { wrapper: languageWrapper(language) },
  );
}

describe("group card", () => {
  it("shows the animal name in English", () => {
    renderCard();

    expect(screen.getByTestId("group-card-fuchs")).toBeInTheDocument();
    expect(screen.getByTestId("group-name")).toHaveTextContent("Fox");
  });

  it("shows the animal name in German", () => {
    renderCard(Language.German);

    expect(screen.getByTestId("group-name")).toHaveTextContent("Fuchs");
  });

  it("tints the card by its animal and draws the glyph twice: badge and watermark", () => {
    const { container } = renderCard();

    expect(screen.getByTestId("group-card-fuchs")).toHaveAttribute(
      "data-animal",
      "fuchs",
    );
    expect(container.querySelectorAll("svg")).toHaveLength(2);
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

  it("gives every member one class and every value another", () => {
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

  it("places the status the caller hands it on the card", () => {
    renderCard(undefined, {
      status: <span data-testid="pill">Editing</span>,
    });

    expect(screen.getByTestId("group-card-fuchs")).toContainElement(
      screen.getByTestId("pill"),
    );
  });

  it("staggers its entrance by the index it is given", () => {
    renderCard(undefined, { index: 3 });

    expect(screen.getByTestId("group-card-fuchs")).toHaveStyle({
      "--index": "3",
    });
  });

  it("enters without delay when it has no index", () => {
    renderCard();

    expect(screen.getByTestId("group-card-fuchs")).not.toHaveAttribute("style");
  });
});
