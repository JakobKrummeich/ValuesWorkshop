import { answerLetterOf } from "../answerLetter";

describe("answer letters", () => {
  it("labels the answers from A onwards", () => {
    expect([0, 1, 2].map(answerLetterOf)).toEqual(["A", "B", "C"]);
  });
});
