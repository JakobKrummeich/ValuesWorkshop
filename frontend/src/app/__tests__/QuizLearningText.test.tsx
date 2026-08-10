import { render, screen } from "@testing-library/react";
import { Language } from "../../domain/i18n/language";
import { languageWrapper } from "../../testing/languageWrapper";
import { QuizLearningText } from "../QuizLearningText";

const learningText = { de: "Weil darum.", en: "Because reasons." };

describe("quiz learning text panel", () => {
  it("labels the learning text in English", () => {
    render(<QuizLearningText learningText={learningText} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("learning-text")).toHaveTextContent(
      "Learning text",
    );
    expect(screen.getByTestId("learning-text")).toHaveTextContent(
      "Because reasons.",
    );
  });

  it("labels the learning text in German", () => {
    render(<QuizLearningText learningText={learningText} />, {
      wrapper: languageWrapper(Language.German),
    });

    expect(screen.getByTestId("learning-text")).toHaveTextContent("Lerntext");
    expect(screen.getByTestId("learning-text")).toHaveTextContent(
      "Weil darum.",
    );
  });
});
