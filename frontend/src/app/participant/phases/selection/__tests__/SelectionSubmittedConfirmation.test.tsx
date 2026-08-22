import { render, screen } from "@testing-library/react";
import { Language } from "../../../../../domain/i18n/language";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { SelectionSubmittedConfirmation } from "../SelectionSubmittedConfirmation";

describe("selection submitted confirmation", () => {
  it("confirms the successful submission", () => {
    const { container } = render(<SelectionSubmittedConfirmation />, {
      wrapper: languageWrapper(),
    });

    const confirmation = screen.getByTestId("selection-submitted-confirmation");
    expect(confirmation).toHaveTextContent("Submission successful");
    expect(confirmation).toHaveTextContent(
      "Your selection has been submitted.",
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("speaks German when German is chosen", () => {
    render(<SelectionSubmittedConfirmation />, {
      wrapper: languageWrapper(Language.German),
    });

    const confirmation = screen.getByTestId("selection-submitted-confirmation");
    expect(confirmation).toHaveTextContent("Abgabe erfolgreich");
    expect(confirmation).toHaveTextContent("Deine Auswahl ist abgegeben.");
  });
});
