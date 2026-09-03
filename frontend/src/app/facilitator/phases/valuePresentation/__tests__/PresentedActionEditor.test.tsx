import { fireEvent, render, screen } from "@testing-library/react";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { PresentedActionEditor } from "../PresentedActionEditor";

const action = { actionId: "action-1", text: "We start meetings on time" };

describe("PresentedActionEditor", () => {
  it("shows the presented text in an input", () => {
    render(<PresentedActionEditor action={action} onCorrect={jest.fn()} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("presented-action-input-action-1")).toHaveValue(
      "We start meetings on time",
    );
    expect(
      screen.getByTestId("presented-action-input-action-1"),
    ).toHaveAccessibleName("Action wording");
  });

  it("corrects the wording when the edit is committed", () => {
    const onCorrect = jest.fn();
    render(<PresentedActionEditor action={action} onCorrect={onCorrect} />, {
      wrapper: languageWrapper(),
    });

    const input = screen.getByTestId("presented-action-input-action-1");
    fireEvent.change(input, { target: { value: "We start on time" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onCorrect).toHaveBeenCalledWith("action-1", "We start on time");
  });
});
