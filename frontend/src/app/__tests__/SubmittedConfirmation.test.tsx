import { render, screen } from "@testing-library/react";
import { MessageKey } from "../../domain/i18n/messages";
import { Language } from "../../domain/i18n/language";
import { languageWrapper } from "../../testing/languageWrapper";
import { SubmittedConfirmation } from "../SubmittedConfirmation";

describe("submitted confirmation", () => {
  function renderConfirmation(language?: Language) {
    return render(
      <SubmittedConfirmation
        heading={MessageKey.SelectionSubmittedHeading}
        body={MessageKey.SelectionSubmittedBody}
        testId="submitted-confirmation"
      />,
      { wrapper: languageWrapper(language) },
    );
  }

  it("shows the given heading and body with a check icon", () => {
    const { container } = renderConfirmation();

    const confirmation = screen.getByTestId("submitted-confirmation");
    expect(confirmation).toHaveTextContent("Submission successful");
    expect(confirmation).toHaveTextContent(
      "Your selection has been submitted.",
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("takes the focus the vanished form left behind", () => {
    renderConfirmation();

    expect(screen.getByTestId("submitted-confirmation")).toHaveFocus();
  });

  it("speaks German when German is chosen", () => {
    renderConfirmation(Language.German);

    const confirmation = screen.getByTestId("submitted-confirmation");
    expect(confirmation).toHaveTextContent("Abgabe erfolgreich");
    expect(confirmation).toHaveTextContent("Deine Auswahl ist abgegeben.");
  });
});
