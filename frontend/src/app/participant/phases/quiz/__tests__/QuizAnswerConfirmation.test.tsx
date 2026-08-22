import { render, screen } from "@testing-library/react";
import { Language } from "../../../../../domain/i18n/language";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { QuizAnswerConfirmation } from "../QuizAnswerConfirmation";

const answer = { de: "Zwei", en: "Two" };

describe("quiz answer confirmation", () => {
  it("shows the label with the chosen answer text", () => {
    render(<QuizAnswerConfirmation answer={answer} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("own-answer-confirmation")).toHaveTextContent(
      "Your answer:",
    );
    expect(screen.getByTestId("own-answer-text")).toHaveTextContent("Two");
  });

  it("takes the focus the vanished answer buttons left behind", () => {
    render(<QuizAnswerConfirmation answer={answer} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("own-answer-confirmation")).toHaveFocus();
  });

  it("speaks German when German is chosen", () => {
    render(<QuizAnswerConfirmation answer={answer} />, {
      wrapper: languageWrapper(Language.German),
    });

    expect(screen.getByTestId("own-answer-confirmation")).toHaveTextContent(
      "Deine Antwort:",
    );
    expect(screen.getByTestId("own-answer-text")).toHaveTextContent("Zwei");
  });
});
