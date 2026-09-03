import { render, screen } from "@testing-library/react";
import { ActionLedger, ActionLedgerVariant } from "../ActionLedger";

const actions = [
  { id: "a1", text: "We share unfinished work on Fridays" },
  { id: "a2", text: "Bad news travels first" },
];

describe("action ledger", () => {
  it("lists the actions in order without numbers or bullets", () => {
    render(
      <ActionLedger
        actions={actions}
        variant={ActionLedgerVariant.Rows}
        actionTestId="presented-action"
      />,
    );

    const items = screen.getAllByTestId("presented-action");
    expect(items.map((item) => item.textContent)).toEqual([
      "We share unfinished work on Fridays",
      "Bad news travels first",
    ]);
    expect(items[0]).not.toHaveAttribute("style");
  });

  it("staggers the slabs by their position", () => {
    render(
      <ActionLedger
        actions={actions}
        variant={ActionLedgerVariant.Slabs}
        stagger
        actionTestId="winner-action"
      />,
    );

    const items = screen.getAllByTestId("winner-action");
    expect(items[0]).toHaveStyle({ "--index": "0" });
    expect(items[1]).toHaveStyle({ "--index": "1" });
  });

  it("renders an empty list for no actions", () => {
    const { container } = render(
      <ActionLedger actions={[]} variant={ActionLedgerVariant.Rows} />,
    );

    expect(container.querySelector("ul")).toBeEmptyDOMElement();
  });
});
