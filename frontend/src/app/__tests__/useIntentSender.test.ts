import { renderHook, act } from "@testing-library/react";
import { NEVER, Observable, of, throwError } from "rxjs";
import { MessageKey } from "../../domain/i18n/messages";
import type { IntentResult } from "../../domain/intentResult";
import { IntentRejectionCode } from "../../domain/intentResult";
import { useIntentSender } from "../useIntentSender";

const accepted: IntentResult = { isAccepted: true, code: null, detail: null };

describe("intent sender", () => {
  it("starts idle without a rejection", () => {
    const { result } = renderHook(() => useIntentSender());

    expect(result.current).toEqual(
      expect.objectContaining({ isSending: false, rejectionMessage: null }),
    );
  });

  it("clears the rejection when the intent is accepted", () => {
    const { result } = renderHook(() => useIntentSender());

    act(() => result.current.sendIntent(of(accepted)));

    expect(result.current.rejectionMessage).toBeNull();
    expect(result.current.isSending).toBe(false);
  });

  it("shows the message of a rejected intent", () => {
    const { result } = renderHook(() => useIntentSender());

    act(() =>
      result.current.sendIntent(
        of({
          isAccepted: false,
          code: IntentRejectionCode.InvariantViolated,
          detail: "the answer is already cast",
        }),
      ),
    );

    expect(result.current.rejectionMessage).toBe(
      MessageKey.IntentInvariantViolated,
    );
  });

  it("shows a transport failure as a generic failure message", () => {
    const { result } = renderHook(() => useIntentSender());

    act(() =>
      result.current.sendIntent(
        throwError(() => new Error("connection is closed")),
      ),
    );

    expect(result.current.rejectionMessage).toBe(MessageKey.IntentFailed);
    expect(result.current.isSending).toBe(false);
  });

  it("reports an in-flight intent", () => {
    const { result } = renderHook(() => useIntentSender());

    act(() => result.current.sendIntent(NEVER));

    expect(result.current.isSending).toBe(true);
  });

  it("abandons an earlier intent when a new one is sent", () => {
    let abandonedCount = 0;
    const hanging = () =>
      new Observable<IntentResult>(() => () => {
        abandonedCount += 1;
      });
    const { result } = renderHook(() => useIntentSender());

    act(() => result.current.sendIntent(hanging()));
    act(() => result.current.sendIntent(hanging()));

    expect(abandonedCount).toBe(1);
  });

  it("abandons an in-flight intent when the screen is left", () => {
    let isAbandoned = false;
    const { result, unmount } = renderHook(() => useIntentSender());

    act(() =>
      result.current.sendIntent(
        new Observable<IntentResult>(() => () => {
          isAbandoned = true;
        }),
      ),
    );
    unmount();

    expect(isAbandoned).toBe(true);
  });
});
