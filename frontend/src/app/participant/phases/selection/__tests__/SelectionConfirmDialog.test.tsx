import { fireEvent, render, screen } from "@testing-library/react";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { SelectionConfirmDialog } from "../SelectionConfirmDialog";

function renderDialog(
  overrides: Partial<{ onCancel: () => void; onConfirm: () => void }> = {},
) {
  render(
    <SelectionConfirmDialog
      onCancel={overrides.onCancel ?? jest.fn()}
      onConfirm={overrides.onConfirm ?? jest.fn()}
    />,
    { wrapper: languageWrapper() },
  );
}

describe("selection confirm dialog", () => {
  it("is an accessible modal focused on the safe cancel action", () => {
    renderDialog();

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("Submit your selection for good?");
    screen.getByText("Your selection cannot be changed afterwards.");
    expect(screen.getByTestId("confirm-cancel-button")).toHaveFocus();
  });

  it("confirms on the confirm button", () => {
    const onConfirm = jest.fn();
    renderDialog({ onConfirm });

    fireEvent.click(screen.getByTestId("confirm-submit-button"));

    expect(onConfirm).toHaveBeenCalled();
  });

  it("cancels on the cancel button", () => {
    const onCancel = jest.fn();
    renderDialog({ onCancel });

    fireEvent.click(screen.getByTestId("confirm-cancel-button"));

    expect(onCancel).toHaveBeenCalled();
  });

  it("cancels on escape", () => {
    const onCancel = jest.fn();
    renderDialog({ onCancel });

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(onCancel).toHaveBeenCalled();
  });

  it("keeps tab focus cycling between the dialog buttons", () => {
    renderDialog();
    const dialog = screen.getByRole("dialog");

    screen.getByTestId("confirm-submit-button").focus();
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(screen.getByTestId("confirm-cancel-button")).toHaveFocus();

    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(screen.getByTestId("confirm-submit-button")).toHaveFocus();
  });

  it("leaves a tab in the middle of the cycle to the browser", () => {
    renderDialog();
    const dialog = screen.getByRole("dialog");

    screen.getByTestId("confirm-cancel-button").focus();
    fireEvent.keyDown(dialog, { key: "Tab" });

    expect(screen.getByTestId("confirm-cancel-button")).toHaveFocus();
  });
});
