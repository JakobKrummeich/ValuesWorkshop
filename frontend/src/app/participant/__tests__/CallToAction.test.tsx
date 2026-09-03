import { render, screen } from "@testing-library/react";
import { CallToAction, CallToActionVariant } from "../CallToAction";

describe("call to action", () => {
  it("fires its handler when pressed", () => {
    const onClick = jest.fn();
    render(
      <CallToAction onClick={onClick} testId="submit-button">
        Submit selection
      </CallToAction>,
    );

    screen.getByRole("button", { name: "Submit selection" }).click();

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("submit-button")).toBeEnabled();
  });

  it("stays quiet while disabled", () => {
    const onClick = jest.fn();
    render(
      <CallToAction onClick={onClick} testId="submit-button" disabled>
        Submit selection
      </CallToAction>,
    );

    screen.getByRole("button", { name: "Submit selection" }).click();

    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByTestId("submit-button")).toBeDisabled();
  });

  it("hands the ghost variant its own class", () => {
    render(
      <CallToAction
        onClick={jest.fn()}
        testId="reopen-button"
        variant={CallToActionVariant.Ghost}
      >
        Reopen result
      </CallToAction>,
    );

    expect(screen.getByTestId("reopen-button").className).toContain("ghost");
  });
});
