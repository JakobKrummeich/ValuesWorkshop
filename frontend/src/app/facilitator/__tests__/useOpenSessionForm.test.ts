import { act, renderHook } from "@testing-library/react";
import { NEVER, Subject, throwError } from "rxjs";
import type { ChangeEvent, FormEvent } from "react";
import type { FacilitatorSessionCreationPort } from "../../../domain/ports/facilitator/sessionCreationPort";
import {
  SessionCreationFailure,
  sessionCreated,
  sessionCreationRejected,
  type SessionCreationOutcome,
} from "../../../domain/sessionCreation";
import { useOpenSessionForm } from "../useOpenSessionForm";

const mockNavigateTo = jest.fn();

jest.mock("../../../adapters/browserLocation", () => ({
  ...jest.requireActual("../../../adapters/browserLocation"),
  navigateTo: (...args: unknown[]) => mockNavigateTo(...args),
}));

const SESSION_IDENTITY = "3f1a0f2e-0000-4000-8000-000000000001";

const openSession = jest.fn();

const sessionCreation: FacilitatorSessionCreationPort = {
  openSession: (sessionName: string, passphrase: string) =>
    openSession(sessionName, passphrase),
};

function changeEvent(value: string): ChangeEvent<HTMLInputElement> {
  return { target: { value } } as ChangeEvent<HTMLInputElement>;
}

function submitEvent(): FormEvent<HTMLFormElement> & {
  preventDefault: jest.Mock;
} {
  return {
    preventDefault: jest.fn(),
  } as unknown as FormEvent<HTMLFormElement> & {
    preventDefault: jest.Mock;
  };
}

function renderForm() {
  const form = renderHook(() => useOpenSessionForm(sessionCreation));

  const fill = (sessionName: string, passphrase: string) => {
    act(() => {
      form.result.current.changeSessionName(changeEvent(sessionName));
      form.result.current.changePassphrase(changeEvent(passphrase));
    });
  };

  const submit = () => {
    const event = submitEvent();
    act(() => {
      form.result.current.submit(event);
    });
    return event;
  };

  return { ...form, fill, submit };
}

function filledAndSubmitted() {
  const form = renderForm();
  form.fill("Herbst 2024", "opensesame");
  const event = form.submit();

  return { ...form, event };
}

function answerWith(outcome: SessionCreationOutcome) {
  const outcomes = new Subject<SessionCreationOutcome>();
  openSession.mockReturnValue(outcomes);
  const form = filledAndSubmitted();

  act(() => {
    outcomes.next(outcome);
    outcomes.complete();
  });

  return form;
}

beforeEach(() => {
  jest.clearAllMocks();
  openSession.mockReturnValue(NEVER);
});

describe("useOpenSessionForm", () => {
  it("starts with an empty, idle, error free form", () => {
    const { result } = renderForm();

    expect(result.current.sessionName).toBe("");
    expect(result.current.passphrase).toBe("");
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.isSubmitting).toBe(false);
  });

  it("keeps what the facilitator types", () => {
    const form = renderForm();

    form.fill("Herbst 2024", "opensesame");

    expect(form.result.current.sessionName).toBe("Herbst 2024");
    expect(form.result.current.passphrase).toBe("opensesame");
  });

  it("blocks a blank session name before any request is made", () => {
    const form = renderForm();
    form.fill("   ", "opensesame");

    form.submit();

    expect(openSession).not.toHaveBeenCalled();
    expect(form.result.current.errorMessage).toBe("Enter a session name.");
    expect(form.result.current.isSubmitting).toBe(false);
  });

  it("keeps the typed passphrase when no request left the browser", () => {
    const form = renderForm();
    form.fill("", "opensesame");

    form.submit();

    expect(form.result.current.passphrase).toBe("opensesame");
  });

  it("prevents the default submission so the passphrase never reaches the URL", () => {
    const { event } = filledAndSubmitted();

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("sends the trimmed session name with the passphrase", () => {
    const form = renderForm();
    form.fill("  Herbst 2024  ", "opensesame");

    form.submit();

    expect(openSession).toHaveBeenCalledWith("Herbst 2024", "opensesame");
  });

  it("is busy while the request is in flight", () => {
    const { result } = filledAndSubmitted();

    expect(result.current.isSubmitting).toBe(true);
    expect(result.current.errorMessage).toBeNull();
  });

  it("navigates to the created session", () => {
    answerWith(sessionCreated(SESSION_IDENTITY));

    expect(mockNavigateTo).toHaveBeenCalledWith(
      `/facilitator?sessionIdentity=${SESSION_IDENTITY}`,
    );
  });

  it("stays busy while the browser leaves for the created session", () => {
    const { result } = answerWith(sessionCreated(SESSION_IDENTITY));

    expect(result.current.isSubmitting).toBe(true);
    expect(result.current.errorMessage).toBeNull();
  });

  it("reports a refused passphrase without revealing anything else", () => {
    const { result } = answerWith(
      sessionCreationRejected(SessionCreationFailure.PassphraseRejected),
    );

    expect(result.current.errorMessage).toBe(
      "That facilitator passphrase was not accepted.",
    );
    expect(mockNavigateTo).not.toHaveBeenCalled();
    expect(result.current.isSubmitting).toBe(false);
  });

  it("reports a refused session name", () => {
    const { result } = answerWith(
      sessionCreationRejected(SessionCreationFailure.SessionNameRejected),
    );

    expect(result.current.errorMessage).toBe(
      "That session name was not accepted. Use up to 120 characters.",
    );
  });

  it("asks the facilitator to sign in again when the token is gone", () => {
    const { result } = answerWith(
      sessionCreationRejected(SessionCreationFailure.NotAuthenticated),
    );

    expect(result.current.errorMessage).toBe(
      "Your sign-in has expired. Sign in again to open a session.",
    );
    expect(mockNavigateTo).not.toHaveBeenCalled();
  });

  it("reports an unreachable backend", () => {
    const { result } = answerWith(
      sessionCreationRejected(SessionCreationFailure.Unexpected),
    );

    expect(result.current.errorMessage).toBe(
      "The session could not be opened. Please try again.",
    );
  });

  it("reports a request that fails outright", () => {
    openSession.mockReturnValue(throwError(() => new Error("boom")));

    const { result } = filledAndSubmitted();

    expect(result.current.errorMessage).toBe(
      "The session could not be opened. Please try again.",
    );
    expect(result.current.isSubmitting).toBe(false);
  });

  it("clears the passphrase once a rejected attempt completes", () => {
    const { result } = answerWith(
      sessionCreationRejected(SessionCreationFailure.PassphraseRejected),
    );

    expect(result.current.passphrase).toBe("");
    expect(result.current.sessionName).toBe("Herbst 2024");
  });

  it("clears the passphrase once a successful attempt completes", () => {
    const { result } = answerWith(sessionCreated(SESSION_IDENTITY));

    expect(result.current.passphrase).toBe("");
  });

  it("clears the passphrase once a failed attempt completes", () => {
    openSession.mockReturnValue(throwError(() => new Error("boom")));

    const { result } = filledAndSubmitted();

    expect(result.current.passphrase).toBe("");
  });

  it("clears an earlier error when the next attempt starts", () => {
    const form = answerWith(
      sessionCreationRejected(SessionCreationFailure.PassphraseRejected),
    );
    openSession.mockReturnValue(NEVER);

    form.fill("Herbst 2024", "second try");
    form.submit();

    expect(form.result.current.errorMessage).toBeNull();
  });

  it("abandons an in-flight request when the form goes away", () => {
    const outcomes = new Subject<SessionCreationOutcome>();
    openSession.mockReturnValue(outcomes);
    const form = filledAndSubmitted();

    expect(outcomes.observed).toBe(true);
    form.unmount();

    expect(outcomes.observed).toBe(false);
  });
});
