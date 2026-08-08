import { renderHook, act } from "@testing-library/react";
import { NEVER, Observable, of, throwError } from "rxjs";
import { MessageKey } from "../../../domain/i18n/messages";
import type { IntentResult } from "../../../domain/intentResult";
import { IntentRejectionCode } from "../../../domain/intentResult";
import type { Single } from "../../../shared/reactiveTypes";
import { useFacilitatorDependencies } from "../dependencies";
import { useAdvancePhaseButton } from "../useAdvancePhaseButton";

jest.mock("../dependencies", () => ({
  useFacilitatorDependencies: jest.fn(),
}));

const dependencies = useFacilitatorDependencies as jest.MockedFunction<
  typeof useFacilitatorDependencies
>;

function withAdvancePhase(advancePhase: () => Single<IntentResult>) {
  dependencies.mockReturnValue({
    sessionStatePort: { workshopState: NEVER, connectionState: NEVER },
    lifecycle: { advancePhase },
  });
}

describe("advance phase button logic", () => {
  it("shows no rejection before anything is pressed", () => {
    withAdvancePhase(() => NEVER);

    const { result } = renderHook(() => useAdvancePhaseButton());

    expect(result.current).toEqual(
      expect.objectContaining({ isAdvancing: false, rejectionMessage: null }),
    );
  });

  it("clears the rejection when the intent is accepted", () => {
    withAdvancePhase(() =>
      of({ isAccepted: true, code: null, detail: null } as IntentResult),
    );
    const { result } = renderHook(() => useAdvancePhaseButton());

    act(() => result.current.advancePhase());

    expect(result.current.rejectionMessage).toBeNull();
    expect(result.current.isAdvancing).toBe(false);
  });

  it("shows the message of a rejected intent", () => {
    withAdvancePhase(() =>
      of({
        isAccepted: false,
        code: IntentRejectionCode.WrongPhase,
        detail: "the workshop is already in its last phase",
      } as IntentResult),
    );
    const { result } = renderHook(() => useAdvancePhaseButton());

    act(() => result.current.advancePhase());

    expect(result.current.rejectionMessage).toBe(MessageKey.IntentWrongPhase);
  });

  it("shows a transport failure as a generic failure message", () => {
    withAdvancePhase(() => throwError(() => new Error("connection is closed")));
    const { result } = renderHook(() => useAdvancePhaseButton());

    act(() => result.current.advancePhase());

    expect(result.current.rejectionMessage).toBe(MessageKey.IntentFailed);
  });

  it("disables itself while the intent is in flight", () => {
    withAdvancePhase(() => NEVER);
    const { result } = renderHook(() => useAdvancePhaseButton());

    act(() => result.current.advancePhase());

    expect(result.current.isAdvancing).toBe(true);
  });

  it("abandons an earlier intent when the button is pressed again", () => {
    let abandonedCount = 0;
    withAdvancePhase(
      () =>
        new Observable<IntentResult>(() => () => {
          abandonedCount += 1;
        }),
    );
    const { result } = renderHook(() => useAdvancePhaseButton());

    act(() => result.current.advancePhase());
    act(() => result.current.advancePhase());

    expect(abandonedCount).toBe(1);
  });

  it("abandons an in-flight intent when the screen is left", () => {
    let isAbandoned = false;
    withAdvancePhase(
      () =>
        new Observable<IntentResult>(() => () => {
          isAbandoned = true;
        }),
    );
    const { result, unmount } = renderHook(() => useAdvancePhaseButton());

    act(() => result.current.advancePhase());
    unmount();

    expect(isAbandoned).toBe(true);
  });
});
