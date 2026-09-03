import { render, screen } from "@testing-library/react";
import { Language } from "../../domain/i18n/language";
import { languageWrapper } from "../../testing/languageWrapper";
import { FormationProgress } from "../FormationProgress";

describe("formation progress", () => {
  it("labels the ring as forming groups and exposes the progress", () => {
    render(<FormationProgress progress={0.42} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("formation-progress")).toHaveTextContent(
      "Forming groups\u2026",
    );
    expect(screen.getByRole("progressbar")).toHaveAccessibleName(
      "Forming groups\u2026",
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "42",
    );
  });

  it("speaks German when German is chosen", () => {
    render(<FormationProgress progress={0} />, {
      wrapper: languageWrapper(Language.German),
    });

    expect(screen.getByTestId("formation-progress")).toHaveTextContent(
      "Gruppen werden gebildet\u2026",
    );
  });
});
