import { render, screen } from "@testing-library/react";
import { Language } from "../../domain/i18n/language";
import { MessageKey } from "../../domain/i18n/messages";
import { languageWrapper } from "../../testing/languageWrapper";
import { WaitingScreen } from "../WaitingScreen";

describe("waiting screen", () => {
  it("shows the heading over the aurora with nothing to interact with", () => {
    const { container } = render(
      <WaitingScreen heading={MessageKey.WaitingEyesUpFront} />,
      { wrapper: languageWrapper() },
    );

    expect(screen.getByTestId("waiting-screen")).toHaveTextContent(
      "Eyes up front",
    );
    expect(container.querySelector("p")).not.toBeInTheDocument();
    expect(
      container.querySelector("button, a, input, select, textarea"),
    ).not.toBeInTheDocument();
    expect(container.querySelector("[aria-hidden='true']")).toBeInTheDocument();
  });

  it("adds the body line with its parameters", () => {
    render(
      <WaitingScreen
        heading={MessageKey.WaitingListenToGroups}
        body={MessageKey.WaitingGroupPresents}
        bodyParameters={{ group: "Fox", value: "Curiosity" }}
      />,
      { wrapper: languageWrapper() },
    );

    expect(screen.getByTestId("waiting-screen")).toHaveTextContent(
      "Listen to the groups",
    );
    expect(screen.getByTestId("waiting-screen")).toHaveTextContent(
      "Fox is presenting Curiosity.",
    );
  });

  it("names itself for assistive technology", () => {
    render(<WaitingScreen heading={MessageKey.WaitingEyesUpFront} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("waiting-screen")).toHaveAccessibleName(
      "Look at the presenter wall",
    );
  });

  it("speaks German when German is chosen", () => {
    render(
      <WaitingScreen
        heading={MessageKey.WaitingEyesUpFront}
        body={MessageKey.WaitingResultsOnScreen}
      />,
      { wrapper: languageWrapper(Language.German) },
    );

    expect(screen.getByTestId("waiting-screen")).toHaveAccessibleName(
      "Schau auf die Präsentationswand",
    );
    expect(screen.getByTestId("waiting-screen")).toHaveTextContent(
      "Blick nach vorn",
    );
    expect(screen.getByTestId("waiting-screen")).toHaveTextContent(
      "Die Ergebnisse sind vorn zu sehen.",
    );
  });
});
