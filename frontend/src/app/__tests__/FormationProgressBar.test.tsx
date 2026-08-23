import { render, screen } from "@testing-library/react";
import { Language } from "../../domain/i18n/language";
import { languageWrapper } from "../../testing/languageWrapper";
import { FormationProgressBar } from "../FormationProgressBar";

describe("formation progress bar", () => {
  it("shows a labelled progress bar", () => {
    render(<FormationProgressBar progress={0} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("formation-progress")).toHaveTextContent(
      "Forming groups\u2026",
    );
    expect(screen.getByRole("progressbar")).toHaveAccessibleName(
      "Forming groups\u2026",
    );
  });

  it("speaks German when German is chosen", () => {
    render(<FormationProgressBar progress={0} />, {
      wrapper: languageWrapper(Language.German),
    });

    expect(screen.getByTestId("formation-progress")).toHaveTextContent(
      "Gruppen werden gebildet\u2026",
    );
  });

  it("fills the track to the progress it is given", () => {
    render(<FormationProgressBar progress={0.42} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("formation-progress-fill")).toHaveStyle({
      "--progress-fraction": "0.42",
    });
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "42",
    );
  });

  it("leaves the track empty at the start of the window", () => {
    render(<FormationProgressBar progress={0} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("formation-progress-fill")).toHaveStyle({
      "--progress-fraction": "0",
    });
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
  });
});
