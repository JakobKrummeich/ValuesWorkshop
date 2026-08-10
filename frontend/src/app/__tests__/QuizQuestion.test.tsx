import { render, screen } from "@testing-library/react";
import { Language } from "../../domain/i18n/language";
import { languageWrapper } from "../../testing/languageWrapper";
import { QuizQuestion } from "../QuizQuestion";

const question = { de: "Wie viele?", en: "How many?" };

describe("quiz question header", () => {
  it("shows the numbered question in English", () => {
    render(
      <QuizQuestion questionNumber={2} questionCount={3} question={question} />,
      { wrapper: languageWrapper() },
    );

    expect(screen.getByTestId("question-heading")).toHaveTextContent(
      "Question 2 of 3",
    );
    expect(screen.getByTestId("question-text")).toHaveTextContent("How many?");
  });

  it("shows the numbered question in German", () => {
    render(
      <QuizQuestion questionNumber={2} questionCount={3} question={question} />,
      { wrapper: languageWrapper(Language.German) },
    );

    expect(screen.getByTestId("question-heading")).toHaveTextContent(
      "Frage 2 von 3",
    );
    expect(screen.getByTestId("question-text")).toHaveTextContent("Wie viele?");
  });
});
