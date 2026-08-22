import { render, screen } from "@testing-library/react";
import { Language } from "../../domain/i18n/language";
import { languageWrapper } from "../../testing/languageWrapper";
import { FormationProgressBar } from "../FormationProgressBar";
import { useFormationProgressBar } from "../useFormationProgressBar";

jest.mock("../useFormationProgressBar", () => ({
  useFormationProgressBar: jest.fn(),
}));

const progressRun = useFormationProgressBar as jest.MockedFunction<
  typeof useFormationProgressBar
>;

describe("formation progress bar", () => {
  it("shows a labelled progress bar", () => {
    render(<FormationProgressBar onProgressComplete={jest.fn()} />, {
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
    render(<FormationProgressBar onProgressComplete={jest.fn()} />, {
      wrapper: languageWrapper(Language.German),
    });

    expect(screen.getByTestId("formation-progress")).toHaveTextContent(
      "Gruppen werden gebildet\u2026",
    );
  });

  it("hands the completion callback to the run", () => {
    const onProgressComplete = jest.fn();

    render(<FormationProgressBar onProgressComplete={onProgressComplete} />, {
      wrapper: languageWrapper(),
    });

    expect(progressRun).toHaveBeenCalledWith(onProgressComplete);
  });
});
