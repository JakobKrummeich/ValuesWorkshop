import { render, screen } from "@testing-library/react";
import { ActionBar } from "../ActionBar";
import { ActionBarSlotProvider } from "../actionBarSlot";

describe("action bar", () => {
  it("renders its hint and action into the shell's footer slot", () => {
    const slot = document.createElement("footer");
    document.body.appendChild(slot);

    render(
      <ActionBarSlotProvider slot={slot}>
        <ActionBar hint="Pick 3 more" hintTestId="selection-hint">
          <button type="button">Submit</button>
        </ActionBar>
      </ActionBarSlotProvider>,
    );

    expect(slot).toContainElement(
      screen.getByRole("button", { name: "Submit" }),
    );
    expect(slot).toContainElement(screen.getByTestId("selection-hint"));
    expect(screen.getByTestId("selection-hint")).toHaveTextContent(
      "Pick 3 more",
    );
    slot.remove();
  });

  it("renders in place while no footer slot exists", () => {
    const { container } = render(
      <ActionBar>
        <button type="button">Submit</button>
      </ActionBar>,
    );

    expect(container).toContainElement(
      screen.getByRole("button", { name: "Submit" }),
    );
    expect(screen.queryByRole("paragraph")).toBeNull();
  });
});
