import { fireEvent, render, screen } from "@testing-library/react";
import { ControlButton } from "../ControlButton";

describe("ControlButton", () => {
  it("renders a button that forwards its click", () => {
    const onClick = jest.fn();
    render(
      <ControlButton testId="control" onClick={onClick}>
        Close voting
      </ControlButton>,
    );

    fireEvent.click(screen.getByTestId("control"));

    expect(screen.getByRole("button", { name: "Close voting" })).toBeEnabled();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled on request", () => {
    render(
      <ControlButton testId="control" isDisabled onClick={jest.fn()}>
        Close voting
      </ControlButton>,
    );

    expect(screen.getByTestId("control")).toBeDisabled();
  });
});
