import { renderHook, act, type RenderHookResult } from "@testing-library/react";
import { NEVER, of, throwError } from "rxjs";
import { MessageKey } from "../../../../../domain/i18n/messages";
import type { IntentResult } from "../../../../../domain/intentResult";
import { IntentRejectionCode } from "../../../../../domain/intentResult";
import type { FinalVote } from "../../../../../domain/ports/participant/votingPort";
import type { ParticipantVotingView } from "../../../../../domain/workshopState";
import type { Single } from "../../../../../shared/reactiveTypes";
import { useParticipantDependencies } from "../../../dependencies";
import {
  useParticipantFinalVotingScreen,
  type ParticipantFinalVotingScreenModel,
} from "../useParticipantFinalVotingScreen";

jest.mock("../../../dependencies", () => ({
  useParticipantDependencies: jest.fn(),
}));

const dependencies = useParticipantDependencies as jest.MockedFunction<
  typeof useParticipantDependencies
>;

function withSubmitFinalVotes(
  submitFinalVotes: (votes: readonly FinalVote[]) => Single<IntentResult>,
) {
  dependencies.mockReturnValue({
    sessionStatePort: { workshopState: NEVER, connectionState: NEVER },
    quizPort: { chooseAnswer: () => NEVER },
    selectionPort: { submitSelection: () => NEVER },
    groupWorkPort: {
      addAction: () => NEVER,
      editAction: () => NEVER,
      removeAction: () => NEVER,
      submitGroupWork: () => NEVER,
      reopenGroupWork: () => NEVER,
    },
    votingPort: { submitFinalVotes },
  });
}

function votingView(
  overrides: Partial<ParticipantVotingView> = {},
): ParticipantVotingView {
  return {
    roundNumber: 1,
    allotment: 5,
    eligibleValues: Array.from({ length: 3 }, (_, index) => ({
      valueId: `wert-${index + 1}`,
      text: { de: `Wert ${index + 1}`, en: `Value ${index + 1}` },
      actions: index === 0 ? ["We start meetings on time"] : [],
    })),
    isRoundOpen: true,
    hasVotedThisRound: false,
    ...overrides,
  };
}

const accepted: IntentResult = { isAccepted: true, code: null, detail: null };

function renderVoting(
  view: ParticipantVotingView = votingView(),
): RenderHookResult<ParticipantFinalVotingScreenModel, ParticipantVotingView> {
  return renderHook(
    (voting: ParticipantVotingView) => useParticipantFinalVotingScreen(voting),
    { initialProps: view },
  );
}

function castVotes(
  result: { current: ParticipantFinalVotingScreenModel },
  votes: Record<string, number>,
) {
  for (const [valueId, count] of Object.entries(votes)) {
    for (let vote = 0; vote < count; vote += 1) {
      act(() => result.current.addVote(valueId));
    }
  }
}

describe("participant final voting screen logic", () => {
  it("starts with an empty ballot over the eligible values", () => {
    withSubmitFinalVotes(() => NEVER);

    const { result } = renderVoting();

    expect(result.current.showConfirmation).toBe(false);
    expect(result.current.usedVotes).toBe(0);
    expect(result.current.allotment).toBe(5);
    expect(result.current.cards).toHaveLength(3);
    expect(result.current.cards[0].actions).toEqual([
      "We start meetings on time",
    ]);
    expect(result.current.cards.every((card) => card.voteCount === 0)).toBe(
      true,
    );
    expect(result.current.cards.every((card) => card.canAdd)).toBe(true);
    expect(result.current.cards.every((card) => !card.canRemove)).toBe(true);
    expect(result.current.canSubmit).toBe(false);
  });

  it("counts added votes per value", () => {
    withSubmitFinalVotes(() => NEVER);
    const { result } = renderVoting();

    castVotes(result, { "wert-1": 2, "wert-2": 1 });

    expect(result.current.usedVotes).toBe(3);
    expect(result.current.cards[0].voteCount).toBe(2);
    expect(result.current.cards[1].voteCount).toBe(1);
    expect(result.current.cards[1].canRemove).toBe(true);
    expect(result.current.cards[2].canRemove).toBe(false);
  });

  it("caps the ballot at the allotment", () => {
    withSubmitFinalVotes(() => NEVER);
    const { result } = renderVoting();

    castVotes(result, { "wert-1": 5 });
    act(() => result.current.addVote("wert-2"));

    expect(result.current.usedVotes).toBe(5);
    expect(result.current.cards[1].voteCount).toBe(0);
    expect(result.current.cards.every((card) => !card.canAdd)).toBe(true);
  });

  it("removes a vote and never drops below zero", () => {
    withSubmitFinalVotes(() => NEVER);
    const { result } = renderVoting();
    castVotes(result, { "wert-1": 1 });

    act(() => result.current.removeVote("wert-1"));
    act(() => result.current.removeVote("wert-1"));

    expect(result.current.usedVotes).toBe(0);
    expect(result.current.cards[0].voteCount).toBe(0);
  });

  it("enables submission exactly at the full allotment", () => {
    withSubmitFinalVotes(() => NEVER);
    const { result } = renderVoting();

    castVotes(result, { "wert-1": 4 });
    expect(result.current.canSubmit).toBe(false);

    act(() => result.current.addVote("wert-2"));
    expect(result.current.canSubmit).toBe(true);
  });

  it("submits only the values that received votes", () => {
    const submitFinalVotes = jest.fn(() => of(accepted));
    withSubmitFinalVotes(submitFinalVotes);
    const { result } = renderVoting();
    castVotes(result, { "wert-1": 3, "wert-3": 2 });

    act(() => result.current.submitVotes());

    expect(submitFinalVotes).toHaveBeenCalledWith([
      { valueId: "wert-1", voteCount: 3 },
      { valueId: "wert-3", voteCount: 2 },
    ]);
    expect(result.current.rejectionMessage).toBeNull();
  });

  it("drops a value stepped up and back down to zero from the ballot", () => {
    const submitFinalVotes = jest.fn(() => of(accepted));
    withSubmitFinalVotes(submitFinalVotes);
    const { result } = renderVoting();
    castVotes(result, { "wert-2": 1, "wert-1": 5 });
    act(() => result.current.removeVote("wert-2"));
    act(() => result.current.addVote("wert-1"));

    act(() => result.current.submitVotes());

    expect(submitFinalVotes).toHaveBeenCalledWith([
      { valueId: "wert-1", voteCount: 5 },
    ]);
  });

  it("ignores a submission below the full allotment", () => {
    const submitFinalVotes = jest.fn(() => of(accepted));
    withSubmitFinalVotes(submitFinalVotes);
    const { result } = renderVoting();
    castVotes(result, { "wert-1": 2 });

    act(() => result.current.submitVotes());

    expect(submitFinalVotes).not.toHaveBeenCalled();
  });

  it("locks the steppers and the submission while the ballot is in flight", () => {
    withSubmitFinalVotes(() => NEVER);
    const { result } = renderVoting();
    castVotes(result, { "wert-1": 5 });

    act(() => result.current.submitVotes());

    expect(result.current.canSubmit).toBe(false);
    expect(result.current.cards.every((card) => !card.canAdd)).toBe(true);
    expect(result.current.cards.every((card) => !card.canRemove)).toBe(true);
  });

  it("keeps the ballot editable with a message when the submission is rejected", () => {
    withSubmitFinalVotes(() =>
      of({
        isAccepted: false,
        code: IntentRejectionCode.InvariantViolated,
        detail: "a ballot spends exactly five votes this round",
      }),
    );
    const { result } = renderVoting();
    castVotes(result, { "wert-1": 5 });

    act(() => result.current.submitVotes());

    expect(result.current.rejectionMessage).toBe(
      MessageKey.IntentInvariantViolated,
    );
    expect(result.current.canSubmit).toBe(true);
  });

  it("shows a transport failure as a generic failure message", () => {
    withSubmitFinalVotes(() => throwError(() => new Error("connection lost")));
    const { result } = renderVoting();
    castVotes(result, { "wert-1": 5 });

    act(() => result.current.submitVotes());

    expect(result.current.rejectionMessage).toBe(MessageKey.IntentFailed);
  });

  it("shows the confirmation once the wire confirms the own ballot", () => {
    withSubmitFinalVotes(() => NEVER);

    const { result } = renderVoting(votingView({ hasVotedThisRound: true }));

    expect(result.current.showConfirmation).toBe(true);
  });

  it("shows the confirmation while the round is closed", () => {
    withSubmitFinalVotes(() => NEVER);

    const { result } = renderVoting(
      votingView({ isRoundOpen: false, hasVotedThisRound: false }),
    );

    expect(result.current.showConfirmation).toBe(true);
  });

  it("resets the ballot when a tiebreak round arrives", () => {
    withSubmitFinalVotes(() => NEVER);
    const { result, rerender } = renderVoting();
    castVotes(result, { "wert-1": 5 });

    rerender(
      votingView({
        roundNumber: 2,
        allotment: 1,
        eligibleValues: [
          {
            valueId: "wert-2",
            text: { de: "Wert 2", en: "Value 2" },
            actions: [],
          },
          {
            valueId: "wert-3",
            text: { de: "Wert 3", en: "Value 3" },
            actions: [],
          },
        ],
      }),
    );

    expect(result.current.showConfirmation).toBe(false);
    expect(result.current.usedVotes).toBe(0);
    expect(result.current.allotment).toBe(1);
    expect(result.current.cards).toHaveLength(2);
    expect(result.current.canSubmit).toBe(false);

    act(() => result.current.addVote("wert-2"));

    expect(result.current.usedVotes).toBe(1);
    expect(result.current.canSubmit).toBe(true);
  });
});
