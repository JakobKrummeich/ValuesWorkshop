import { renderHook, act, type RenderHookResult } from "@testing-library/react";
import { NEVER, of, throwError } from "rxjs";
import { MessageKey } from "../../../../../domain/i18n/messages";
import type { IntentResult } from "../../../../../domain/intentResult";
import { IntentRejectionCode } from "../../../../../domain/intentResult";
import type { OwnSelectionView } from "../../../../../domain/workshopState";
import type { Single } from "../../../../../shared/reactiveTypes";
import { useParticipantDependencies } from "../../../dependencies";
import {
  requiredSelectionCount,
  useParticipantSelectionScreen,
  type ParticipantSelectionScreenModel,
} from "../useParticipantSelectionScreen";

jest.mock("../../../dependencies", () => ({
  useParticipantDependencies: jest.fn(),
}));

const dependencies = useParticipantDependencies as jest.MockedFunction<
  typeof useParticipantDependencies
>;

function withSubmitSelection(
  submitSelection: (valueIds: readonly string[]) => Single<IntentResult>,
) {
  dependencies.mockReturnValue({
    sessionStatePort: { workshopState: NEVER, connectionState: NEVER },
    quizPort: { chooseAnswer: () => NEVER },
    selectionPort: { submitSelection },
    groupWorkPort: {
      addAction: () => NEVER,
      editAction: () => NEVER,
      removeAction: () => NEVER,
      submitGroupWork: () => NEVER,
      reopenGroupWork: () => NEVER,
    },
  });
}

function selectionView(
  overrides: Partial<OwnSelectionView> = {},
): OwnSelectionView {
  return {
    values: Array.from({ length: 12 }, (_, index) => ({
      valueId: `value-${index}`,
      text: { de: `Wert ${index}`, en: `Value ${index}` },
    })),
    ownSelectedValueIds: [],
    isSubmitted: false,
    ...overrides,
  };
}

const firstTenValueIds = Array.from(
  { length: requiredSelectionCount },
  (_, index) => `value-${index}`,
);

const accepted: IntentResult = { isAccepted: true, code: null, detail: null };

function renderSelection(
  view: OwnSelectionView = selectionView(),
): RenderHookResult<ParticipantSelectionScreenModel, OwnSelectionView> {
  return renderHook(
    (selection: OwnSelectionView) => useParticipantSelectionScreen(selection),
    { initialProps: view },
  );
}

function selectAll(
  result: { current: ParticipantSelectionScreenModel },
  valueIds: readonly string[],
) {
  for (const valueId of valueIds) {
    act(() => result.current.toggleValue(valueId));
  }
}

function attachedSubmitButton(result: {
  current: ParticipantSelectionScreenModel;
}): HTMLButtonElement {
  const submitButton = document.createElement("button");
  document.body.appendChild(submitButton);
  result.current.submitButtonRef.current = submitButton;
  return submitButton;
}

describe("participant selection screen logic", () => {
  it("starts with nothing selected and everything selectable", () => {
    withSubmitSelection(() => NEVER);

    const { result } = renderSelection();

    expect(result.current.selectedCount).toBe(0);
    expect(result.current.chips).toHaveLength(12);
    expect(result.current.chips.every((chip) => !chip.isSelected)).toBe(true);
    expect(result.current.chips.every((chip) => !chip.isDisabled)).toBe(true);
    expect(result.current.canSubmit).toBe(false);
  });

  it("counts a toggled value as selected", () => {
    withSubmitSelection(() => NEVER);
    const { result } = renderSelection();

    act(() => result.current.toggleValue("value-3"));

    expect(result.current.selectedCount).toBe(1);
    expect(result.current.chips[3].isSelected).toBe(true);
  });

  it("deselects a value on the second toggle", () => {
    withSubmitSelection(() => NEVER);
    const { result } = renderSelection();

    act(() => result.current.toggleValue("value-3"));
    act(() => result.current.toggleValue("value-3"));

    expect(result.current.selectedCount).toBe(0);
    expect(result.current.chips[3].isSelected).toBe(false);
  });

  it("locks the unselected values once ten are chosen", () => {
    withSubmitSelection(() => NEVER);
    const { result } = renderSelection();

    selectAll(result, firstTenValueIds);

    expect(result.current.selectedCount).toBe(10);
    expect(result.current.chips[10].isDisabled).toBe(true);
    expect(result.current.chips[11].isDisabled).toBe(true);
    expect(result.current.chips[0].isDisabled).toBe(false);
  });

  it("frees the locked values again after a deselection swap", () => {
    withSubmitSelection(() => NEVER);
    const { result } = renderSelection();
    selectAll(result, firstTenValueIds);

    act(() => result.current.toggleValue("value-0"));

    expect(result.current.selectedCount).toBe(9);
    expect(result.current.chips[10].isDisabled).toBe(false);
  });

  it("refuses to grow the selection beyond ten", () => {
    withSubmitSelection(() => NEVER);
    const { result } = renderSelection();
    selectAll(result, firstTenValueIds);

    act(() => result.current.toggleValue("value-11"));

    expect(result.current.selectedCount).toBe(10);
    expect(result.current.chips[11].isSelected).toBe(false);
  });

  it("allows submission only at exactly ten", () => {
    withSubmitSelection(() => NEVER);
    const { result } = renderSelection();

    selectAll(result, firstTenValueIds.slice(0, 9));
    expect(result.current.canSubmit).toBe(false);

    act(() => result.current.toggleValue("value-9"));
    expect(result.current.canSubmit).toBe(true);
  });

  it("asks for confirmation instead of submitting straight away", () => {
    const submitSelection = jest.fn(() => of(accepted));
    withSubmitSelection(submitSelection);
    const { result } = renderSelection();
    selectAll(result, firstTenValueIds);

    act(() => result.current.requestSubmission());

    expect(result.current.isConfirming).toBe(true);
    expect(submitSelection).not.toHaveBeenCalled();
  });

  it("ignores a submission request below ten", () => {
    withSubmitSelection(() => NEVER);
    const { result } = renderSelection();

    act(() => result.current.requestSubmission());

    expect(result.current.isConfirming).toBe(false);
  });

  it("closes the confirmation without submitting on cancel", () => {
    const submitSelection = jest.fn(() => of(accepted));
    withSubmitSelection(submitSelection);
    const { result } = renderSelection();
    selectAll(result, firstTenValueIds);
    act(() => result.current.requestSubmission());

    act(() => result.current.cancelSubmission());

    expect(result.current.isConfirming).toBe(false);
    expect(submitSelection).not.toHaveBeenCalled();
  });

  it("returns focus to the submit button when the confirmation is cancelled", () => {
    withSubmitSelection(() => NEVER);
    const { result } = renderSelection();
    const submitButton = attachedSubmitButton(result);
    selectAll(result, firstTenValueIds);
    act(() => result.current.requestSubmission());

    act(() => result.current.cancelSubmission());

    expect(document.activeElement).toBe(submitButton);
    submitButton.remove();
  });

  it("returns focus to the submit button when the submission is confirmed", () => {
    withSubmitSelection(() => of(accepted));
    const { result } = renderSelection();
    const submitButton = attachedSubmitButton(result);
    selectAll(result, firstTenValueIds);
    act(() => result.current.requestSubmission());

    act(() => result.current.confirmSubmission());

    expect(document.activeElement).toBe(submitButton);
    submitButton.remove();
  });

  it("submits the chosen ten on confirmation", () => {
    const submitSelection = jest.fn(() => of(accepted));
    withSubmitSelection(submitSelection);
    const { result } = renderSelection();
    selectAll(result, firstTenValueIds);
    act(() => result.current.requestSubmission());

    act(() => result.current.confirmSubmission());

    expect(result.current.isConfirming).toBe(false);
    expect(submitSelection).toHaveBeenCalledWith(firstTenValueIds);
  });

  it("locks everything while the submission is in flight", () => {
    withSubmitSelection(() => NEVER);
    const { result } = renderSelection();
    selectAll(result, firstTenValueIds);
    act(() => result.current.requestSubmission());

    act(() => result.current.confirmSubmission());

    expect(result.current.canSubmit).toBe(false);
    expect(result.current.chips.every((chip) => chip.isDisabled)).toBe(true);
  });

  it("reopens the grid with a message when the submission is rejected", () => {
    withSubmitSelection(() =>
      of({
        isAccepted: false,
        code: IntentRejectionCode.MalformedPayload,
        detail: "the selection must hold exactly ten distinct values",
      }),
    );
    const { result } = renderSelection();
    selectAll(result, firstTenValueIds);
    act(() => result.current.requestSubmission());

    act(() => result.current.confirmSubmission());

    expect(result.current.rejectionMessage).toBe(
      MessageKey.IntentMalformedPayload,
    );
    expect(result.current.canSubmit).toBe(true);
  });

  it("shows a transport failure as a generic failure message", () => {
    withSubmitSelection(() => throwError(() => new Error("connection lost")));
    const { result } = renderSelection();
    selectAll(result, firstTenValueIds);
    act(() => result.current.requestSubmission());

    act(() => result.current.confirmSubmission());

    expect(result.current.rejectionMessage).toBe(MessageKey.IntentFailed);
  });

  it("locks the submitted selection delivered by the wire", () => {
    withSubmitSelection(() => NEVER);

    const { result } = renderSelection(
      selectionView({
        ownSelectedValueIds: firstTenValueIds,
        isSubmitted: true,
      }),
    );

    expect(result.current.isSubmitted).toBe(true);
    expect(result.current.selectedCount).toBe(10);
    expect(result.current.chips[0].isSelected).toBe(true);
    expect(result.current.chips.every((chip) => chip.isDisabled)).toBe(true);
    expect(result.current.canSubmit).toBe(false);
  });

  it("shows the wire selection once the own submission is confirmed", () => {
    withSubmitSelection(() => of(accepted));
    const { result, rerender } = renderSelection();
    selectAll(result, firstTenValueIds);
    act(() => result.current.requestSubmission());
    act(() => result.current.confirmSubmission());

    rerender(
      selectionView({
        ownSelectedValueIds: firstTenValueIds,
        isSubmitted: true,
      }),
    );

    expect(result.current.isSubmitted).toBe(true);
    expect(result.current.selectedCount).toBe(10);
    expect(result.current.chips.every((chip) => chip.isDisabled)).toBe(true);
  });

  it("seeds the local selection from the wire when present", () => {
    withSubmitSelection(() => NEVER);

    const { result } = renderSelection(
      selectionView({ ownSelectedValueIds: ["value-2", "value-5"] }),
    );

    expect(result.current.selectedCount).toBe(2);
    expect(result.current.chips[2].isSelected).toBe(true);
    expect(result.current.chips[5].isSelected).toBe(true);
    expect(result.current.canSubmit).toBe(false);
  });
});
