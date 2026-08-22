import { render, screen } from "@testing-library/react";
import { Language } from "../../domain/i18n/language";
import { languageWrapper } from "../../testing/languageWrapper";
import { WaitingScreen } from "../WaitingScreen";

describe("waiting screen", () => {
  it("shows the pulsating icon, no text and nothing to interact with", () => {
    const { container } = render(<WaitingScreen />, {
      wrapper: languageWrapper(),
    });

    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByTestId("waiting-screen")).toHaveTextContent("");
    expect(
      container.querySelector("button, a, input, select, textarea"),
    ).not.toBeInTheDocument();
  });

  it("names itself for assistive technology", () => {
    render(<WaitingScreen />, { wrapper: languageWrapper() });

    expect(screen.getByTestId("waiting-screen")).toHaveAccessibleName(
      "Look at the presenter wall",
    );
  });

  it("speaks German when German is chosen", () => {
    render(<WaitingScreen />, { wrapper: languageWrapper(Language.German) });

    expect(screen.getByTestId("waiting-screen")).toHaveAccessibleName(
      "Schau auf die Präsentationswand",
    );
  });
});
