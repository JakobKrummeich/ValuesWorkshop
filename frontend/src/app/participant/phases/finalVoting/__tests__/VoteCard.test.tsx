import { render, screen } from "@testing-library/react";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { VoteCard } from "../VoteCard";
import type { VoteCardModel } from "../useParticipantFinalVotingScreen";

function card(overrides: Partial<VoteCardModel> = {}): VoteCardModel {
  return {
    valueId: "wert-1",
    text: { de: "Wert 1", en: "Value 1" },
    actions: ["We start meetings on time", "We share mistakes openly"],
    voteCount: 2,
    canAdd: true,
    canRemove: true,
    ...overrides,
  };
}

describe("vote card", () => {
  it("shows the value name, its actions and the vote count", () => {
    render(<VoteCard card={card()} onAdd={jest.fn()} onRemove={jest.fn()} />, {
      wrapper: languageWrapper(),
    });

    const rendered = screen.getByTestId("vote-card-wert-1");
    expect(rendered).toHaveTextContent("Value 1");
    expect(rendered).toHaveTextContent("We start meetings on time");
    expect(rendered).toHaveTextContent("We share mistakes openly");
    expect(screen.getByTestId("vote-count-wert-1")).toHaveTextContent("2");
  });

  it("steps the vote count through the handlers", () => {
    const onAdd = jest.fn();
    const onRemove = jest.fn();
    render(<VoteCard card={card()} onAdd={onAdd} onRemove={onRemove} />, {
      wrapper: languageWrapper(),
    });

    screen.getByTestId("add-vote-wert-1").click();
    screen.getByTestId("remove-vote-wert-1").click();

    expect(onAdd).toHaveBeenCalledWith("wert-1");
    expect(onRemove).toHaveBeenCalledWith("wert-1");
  });

  it("disables the steppers when the hook forbids them", () => {
    render(
      <VoteCard
        card={card({ canAdd: false, canRemove: false })}
        onAdd={jest.fn()}
        onRemove={jest.fn()}
      />,
      { wrapper: languageWrapper() },
    );

    expect(screen.getByTestId("add-vote-wert-1")).toBeDisabled();
    expect(screen.getByTestId("remove-vote-wert-1")).toBeDisabled();
  });
});
