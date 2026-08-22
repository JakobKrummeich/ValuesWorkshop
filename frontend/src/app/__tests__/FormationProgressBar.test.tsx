import { render, screen } from "@testing-library/react";
import { Language } from "../../domain/i18n/language";
import { languageWrapper } from "../../testing/languageWrapper";
import { FormationProgressBar } from "../FormationProgressBar";

describe("formation progress bar", () => {
  it("shows a labelled progress bar", () => {
    render(<FormationProgressBar />, { wrapper: languageWrapper() });

    expect(screen.getByTestId("formation-progress")).toHaveTextContent(
      "Forming groups\u2026",
    );
    expect(screen.getByRole("progressbar")).toHaveAccessibleName(
      "Forming groups\u2026",
    );
  });

  it("speaks German when German is chosen", () => {
    render(<FormationProgressBar />, {
      wrapper: languageWrapper(Language.German),
    });

    expect(screen.getByTestId("formation-progress")).toHaveTextContent(
      "Gruppen werden gebildet\u2026",
    );
  });
});
