import { of, Subject, throwError } from "rxjs";
import type { IntentResult } from "../../../../../domain/intentResult";
import type { Single } from "../../../../../shared/reactiveTypes";
import {
  createThrottledActionEdits,
  editThrottleIntervalMilliseconds,
  type ThrottledActionEdits,
} from "../throttledActionEdits";

const accepted: IntentResult = { isAccepted: true, code: null, detail: null };

type SendEdit = (actionId: string, text: string) => Single<IntentResult>;

let stream: ThrottledActionEdits | null = null;

function createEdits(sendEdit: SendEdit): ThrottledActionEdits {
  stream = createThrottledActionEdits(sendEdit);
  return stream;
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  stream?.stop();
  stream = null;
  jest.useRealTimers();
});

describe("createThrottledActionEdits", () => {
  it("sends the first edit of an action immediately", () => {
    const sendEdit = jest.fn<Single<IntentResult>, [string, string]>(() =>
      of(accepted),
    );
    const edits = createEdits(sendEdit);

    edits.queueEdit("a1", "T");

    expect(sendEdit).toHaveBeenCalledTimes(1);
    expect(sendEdit).toHaveBeenCalledWith("a1", "T");
  });

  it("sends only the latest text of a burst when the throttle window ends", () => {
    const sendEdit = jest.fn<Single<IntentResult>, [string, string]>(() =>
      of(accepted),
    );
    const edits = createEdits(sendEdit);

    edits.queueEdit("a1", "T");
    edits.queueEdit("a1", "Ta");
    edits.queueEdit("a1", "Tal");
    expect(sendEdit).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(editThrottleIntervalMilliseconds);

    expect(sendEdit).toHaveBeenCalledTimes(2);
    expect(sendEdit).toHaveBeenLastCalledWith("a1", "Tal");
  });

  it("sends nothing further when the window ends without new edits", () => {
    const sendEdit = jest.fn<Single<IntentResult>, [string, string]>(() =>
      of(accepted),
    );
    const edits = createEdits(sendEdit);

    edits.queueEdit("a1", "T");
    jest.advanceTimersByTime(editThrottleIntervalMilliseconds);

    expect(sendEdit).toHaveBeenCalledTimes(1);
  });

  it("throttles each action independently", () => {
    const sendEdit = jest.fn<Single<IntentResult>, [string, string]>(() =>
      of(accepted),
    );
    const edits = createEdits(sendEdit);

    edits.queueEdit("a1", "T");
    edits.queueEdit("a2", "D");

    expect(sendEdit).toHaveBeenCalledTimes(2);
    expect(sendEdit).toHaveBeenCalledWith("a1", "T");
    expect(sendEdit).toHaveBeenCalledWith("a2", "D");
  });

  it("drops a pending edit for a cancelled action", () => {
    const sendEdit = jest.fn<Single<IntentResult>, [string, string]>(() =>
      of(accepted),
    );
    const edits = createEdits(sendEdit);

    edits.queueEdit("a1", "T");
    edits.queueEdit("a1", "Ta");
    edits.cancelEditsFor("a1");
    jest.advanceTimersByTime(editThrottleIntervalMilliseconds);

    expect(sendEdit).toHaveBeenCalledTimes(1);
  });

  it("keeps other actions' pending edits when one action is cancelled", () => {
    const sendEdit = jest.fn<Single<IntentResult>, [string, string]>(() =>
      of(accepted),
    );
    const edits = createEdits(sendEdit);

    edits.queueEdit("a1", "T");
    edits.queueEdit("a1", "Ta");
    edits.queueEdit("a2", "D");
    edits.queueEdit("a2", "Da");
    edits.cancelEditsFor("a1");
    jest.advanceTimersByTime(editThrottleIntervalMilliseconds);

    expect(sendEdit).toHaveBeenCalledTimes(3);
    expect(sendEdit).toHaveBeenLastCalledWith("a2", "Da");
  });

  it("sends edits for an action again after it was cancelled", () => {
    const sendEdit = jest.fn<Single<IntentResult>, [string, string]>(() =>
      of(accepted),
    );
    const edits = createEdits(sendEdit);

    edits.queueEdit("a1", "T");
    edits.cancelEditsFor("a1");
    edits.queueEdit("a1", "Z");

    expect(sendEdit).toHaveBeenCalledTimes(2);
    expect(sendEdit).toHaveBeenLastCalledWith("a1", "Z");
  });

  it("ignores cancelling an action that never queued an edit", () => {
    const sendEdit = jest.fn<Single<IntentResult>, [string, string]>(() =>
      of(accepted),
    );
    const edits = createEdits(sendEdit);

    edits.cancelEditsFor("unknown");
    edits.queueEdit("a1", "T");

    expect(sendEdit).toHaveBeenCalledTimes(1);
  });

  it("keeps sending after a failed edit", () => {
    const sendEdit = jest
      .fn<Single<IntentResult>, [string, string]>(() => of(accepted))
      .mockImplementationOnce(() => throwError(() => new Error("boom")));
    const edits = createEdits(sendEdit);

    edits.queueEdit("a1", "T");
    jest.advanceTimersByTime(editThrottleIntervalMilliseconds);
    edits.queueEdit("a1", "Ta");
    edits.queueEdit("a2", "D");

    expect(sendEdit).toHaveBeenCalledTimes(3);
    expect(sendEdit).toHaveBeenCalledWith("a1", "Ta");
    expect(sendEdit).toHaveBeenCalledWith("a2", "D");
  });

  it("waits for an action's in-flight send before sending its next edit", () => {
    const firstSend = new Subject<IntentResult>();
    const sendEdit = jest
      .fn<Single<IntentResult>, [string, string]>(() => of(accepted))
      .mockImplementationOnce(() => firstSend);
    const edits = createEdits(sendEdit);

    edits.queueEdit("a1", "T");
    edits.queueEdit("a1", "Ta");
    jest.advanceTimersByTime(editThrottleIntervalMilliseconds);
    expect(sendEdit).toHaveBeenCalledTimes(1);

    firstSend.next(accepted);
    firstSend.complete();

    expect(sendEdit).toHaveBeenCalledTimes(2);
    expect(sendEdit).toHaveBeenLastCalledWith("a1", "Ta");
  });

  it("stops sending after stop", () => {
    const sendEdit = jest.fn<Single<IntentResult>, [string, string]>(() =>
      of(accepted),
    );
    const edits = createEdits(sendEdit);

    edits.queueEdit("a1", "T");
    edits.queueEdit("a1", "Ta");
    edits.stop();
    jest.advanceTimersByTime(editThrottleIntervalMilliseconds);

    expect(sendEdit).toHaveBeenCalledTimes(1);
  });
});
