import { renderHook } from "@testing-library/react";
import { EMPTY, Subject, defer, ignoreElements, throwError } from "rxjs";
import { currentSessionIdentity } from "../../adapters/browserLocation";
import type { WorkshopSession } from "../../adapters/workshopSessions";
import { useWorkshopSession } from "../useWorkshopSession";

jest.mock("../../adapters/browserLocation", () => ({
  currentSessionIdentity: jest.fn(),
}));

const sessionIdentity = currentSessionIdentity as jest.MockedFunction<
  typeof currentSessionIdentity
>;

interface FakeSession extends WorkshopSession {
  identity: string;
  stopped: Subject<never>;
}

function fakeSessionFactory(): {
  create: (identity: string) => FakeSession;
  sessions: FakeSession[];
} {
  const sessions: FakeSession[] = [];
  const create = (identity: string) => {
    const stopped = new Subject<never>();
    const session: FakeSession = {
      identity,
      stopped,
      start: EMPTY,
      close: defer(() => {
        stopped.complete();
        return EMPTY;
      }),
    };
    sessions.push(session);
    return session;
  };

  return { create, sessions };
}

describe("workshop session lifetime", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("creates the session bound to the identity in the link", () => {
    sessionIdentity.mockReturnValue("session-7");
    const { create, sessions } = fakeSessionFactory();

    const { result } = renderHook(() => useWorkshopSession(create));

    expect(sessions).toHaveLength(1);
    expect(result.current.session?.identity).toBe("session-7");
    expect(result.current.isSessionIdentityMissing).toBe(false);
  });

  it("reports a link without a session identity and creates nothing", () => {
    sessionIdentity.mockReturnValue(null);
    const { create, sessions } = fakeSessionFactory();

    const { result } = renderHook(() => useWorkshopSession(create));

    expect(sessions).toHaveLength(0);
    expect(result.current.isSessionIdentityMissing).toBe(true);
    expect(result.current.session).toBeNull();
  });

  it("closes the session when the screen is left", () => {
    sessionIdentity.mockReturnValue("session-7");
    const { create, sessions } = fakeSessionFactory();
    const { unmount } = renderHook(() => useWorkshopSession(create));

    let isClosed = false;
    sessions[0].stopped.subscribe({ complete: () => (isClosed = true) });
    unmount();

    expect(isClosed).toBe(true);
  });

  it("logs a failed start instead of crashing the screen", () => {
    sessionIdentity.mockReturnValue("session-7");
    const logged = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const create = (): WorkshopSession => ({
      start: throwError(() => new Error("the hub refused")).pipe(
        ignoreElements(),
      ),
      close: EMPTY,
    });

    renderHook(() => useWorkshopSession(create));

    expect(logged).toHaveBeenCalledWith(
      "The workshop connection could not be started",
      expect.any(Error),
    );
    logged.mockRestore();
  });
});
