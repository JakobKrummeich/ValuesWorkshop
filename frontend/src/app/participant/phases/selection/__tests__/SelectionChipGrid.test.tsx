import { fireEvent, render, screen } from "@testing-library/react";
import { Language } from "../../../../../domain/i18n/language";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { SelectionChipGrid } from "../SelectionChipGrid";
import type { SelectionChip } from "../useParticipantSelectionScreen";

const values = [
  { valueId: "trust", text: { de: "Vertrauen", en: "Trust" } },
  { valueId: "courage", text: { de: "Mut", en: "Courage" } },
  { valueId: "respect", text: { de: "Respekt", en: "Respect" } },
];

function chip(overrides: Partial<SelectionChip> = {}): SelectionChip {
  return {
    valueId: "trust",
    text: values[0].text,
    isSelected: false,
    isDisabled: false,
    ...overrides,
  };
}

const chips = values.map((value) =>
  chip({ valueId: value.valueId, text: value.text }),
);

describe("selection chip grid", () => {
  it("renders every value as a toggle chip", () => {
    const onToggle = jest.fn();

    render(<SelectionChipGrid chips={chips} onToggle={onToggle} />, {
      wrapper: languageWrapper(),
    });
    fireEvent.click(screen.getByTestId("value-chip-courage"));

    expect(screen.getByTestId("value-chip-trust")).toHaveTextContent("Trust");
    expect(onToggle).toHaveBeenCalledWith("courage");
  });

  it("marks selected and disabled chips for styling and the at-ten lock", () => {
    render(
      <SelectionChipGrid
        chips={[
          chip({ valueId: "trust", isSelected: true }),
          chip({ valueId: "courage", text: values[1].text, isDisabled: true }),
          chip({ valueId: "respect", text: values[2].text }),
        ]}
        onToggle={jest.fn()}
      />,
      { wrapper: languageWrapper() },
    );

    expect(screen.getByTestId("value-chip-trust")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("value-chip-courage")).toBeDisabled();
    expect(screen.getByTestId("value-chip-respect")).not.toBeDisabled();
  });

  it("speaks German when German is chosen", () => {
    render(<SelectionChipGrid chips={chips} onToggle={jest.fn()} />, {
      wrapper: languageWrapper(Language.German),
    });

    expect(screen.getByTestId("value-chip-trust")).toHaveTextContent(
      "Vertrauen",
    );
  });
});
