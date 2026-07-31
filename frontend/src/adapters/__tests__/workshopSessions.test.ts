import { NEVER, of } from "rxjs";
import type { SignalRConnection } from "../signalRConnection";
import {
  createFacilitatorSession,
  createParticipantSession,
  createPresenterSession,
} from "../workshopSessions";
import { createSignalRConnection } from "../signalRConnection";
import { getAccessToken } from "../authAdapter";

jest.mock("../signalRConnection", () => ({
  createSignalRConnection: jest.fn(),
}));
jest.mock("../authAdapter", () => ({ getAccessToken: jest.fn() }));

const createConnection = createSignalRConnection as jest.MockedFunction<
  typeof createSignalRConnection
>;
const accessToken = getAccessToken as jest.MockedFunction<
  typeof getAccessToken
>;

const SESSION_IDENTITY = "3f1a0f2e-0000-4000-8000-000000000001";

function fakeConnection(): SignalRConnection & {
  start: jest.Mock;
  stop: jest.Mock;
} {
  return {
    connectionState: NEVER,
    start: jest.fn(() => NEVER as never),
    stop: jest.fn(() => NEVER as never),
    on: () => NEVER,
    invoke: () => NEVER,
  };
}

function urlOfLastConnection(): string {
  return createConnection.mock.calls[0][0].url;
}

describe("session-bound role connections", () => {
  beforeEach(() => {
    createConnection.mockReturnValue(fakeConnection());
    accessToken.mockReturnValue(of("a-token"));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("binds the participant hub url to the session identity", () => {
    createParticipantSession(SESSION_IDENTITY);

    expect(urlOfLastConnection()).toBe(
      `http://localhost:5000/hub/participant?sessionIdentity=${SESSION_IDENTITY}`,
    );
  });

  it("binds the facilitator hub url and exposes the lifecycle slice", () => {
    const session = createFacilitatorSession(SESSION_IDENTITY);

    expect(urlOfLastConnection()).toContain("/hub/facilitator");
    expect(session.lifecycle.advancePhase).toBeInstanceOf(Function);
  });

  it("connects the presenter anonymously", () => {
    createPresenterSession(SESSION_IDENTITY);

    expect(urlOfLastConnection()).toContain("/hub/presenter");
    expect(
      createConnection.mock.calls[0][0].accessTokenFactory,
    ).toBeUndefined();
  });

  it("hands the current access token to authenticated hubs", async () => {
    createParticipantSession(SESSION_IDENTITY);

    const factory = createConnection.mock.calls[0][0].accessTokenFactory!;

    await expect(factory()).resolves.toBe("a-token");
  });

  it("escapes a session identity that is not url safe", () => {
    createPresenterSession("a b&c");

    expect(urlOfLastConnection()).toContain("sessionIdentity=a%20b%26c");
  });

  it("starts and closes the underlying connection", () => {
    const connection = fakeConnection();
    createConnection.mockReturnValue(connection);

    const session = createParticipantSession(SESSION_IDENTITY);
    session.start().subscribe();
    session.close().subscribe();

    expect(connection.start).toHaveBeenCalled();
    expect(connection.stop).toHaveBeenCalled();
  });
});
