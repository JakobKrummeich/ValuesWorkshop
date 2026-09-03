import { fireEvent, render, screen } from "@testing-library/react";
import { VoteControl } from "../VoteControl";

function renderControl(
  overrides: Partial<Parameters<typeof VoteControl>[0]> = {},
) {
  const onAdd = jest.fn();
  const onRemove = jest.fn();
  render(
    <VoteControl
      count={2}
      canAdd
      canRemove
      onAdd={onAdd}
      onRemove={onRemove}
      addLabel="Add a vote for Trust"
      removeLabel="Remove a vote from Trust"
      testIds={{ add: "add-vote", remove: "remove-vote", count: "vote-count" }}
      {...overrides}
    />,
  );

  return { onAdd, onRemove };
}

describe("vote control", () => {
  it("shows the count between a labelled minus and plus", () => {
    const { onAdd, onRemove } = renderControl();

    expect(screen.getByTestId("vote-count")).toHaveTextContent("2");
    fireEvent.click(screen.getByLabelText("Add a vote for Trust"));
    fireEvent.click(screen.getByLabelText("Remove a vote from Trust"));

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("add-vote")).toBeEnabled();
    expect(screen.getByTestId("remove-vote")).toBeEnabled();
  });

  it("disables what cannot happen", () => {
    renderControl({ canAdd: false, canRemove: false, count: 0 });

    expect(screen.getByTestId("add-vote")).toBeDisabled();
    expect(screen.getByTestId("remove-vote")).toBeDisabled();
  });
});
