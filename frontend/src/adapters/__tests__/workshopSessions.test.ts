import { EMPTY, NEVER, defer, firstValueFrom, of } from "rxjs";
import type { WebsocketConnection } from "../websocketConnection";
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

interface FakeConnection {
  connection: WebsocketConnection;
  isStarted: () => boolean;
  isStopped: () => boolean;
}

function fakeConnection(): FakeConnection {
  let isStarted = false;
  let isStopped = false;

  return {
    connection: {
      connectionState: NEVER,
      start: defer(() => {
        isStarted = true;
        return EMPTY;
      }),
      stop: defer(() => {
        isStopped = true;
        return EMPTY;
      }),
      on: () => NEVER,
      invoke: () => NEVER,
    },
    isStarted: () => isStarted,
    isStopped: () => isStopped,
  };
}

function urlOfLastConnection(): string {
  return createConnection.mock.calls[0][0].url;
}

describe("session-bound role connections", () => {
  beforeEach(() => {
    createConnection.mockReturnValue(fakeConnection().connection);
    accessToken.mockReturnValue(of("a-token"));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("binds the participant hub url to the session identity", () => {
    const session = createParticipantSession(SESSION_IDENTITY);

    expect(urlOfLastConnection()).toBe(
      `http://localhost:5000/hub/participant?sessionIdentity=${SESSION_IDENTITY}`,
    );
    expect(session.quiz.chooseAnswer).toBeInstanceOf(Function);
  });

  it("binds the facilitator hub url and exposes the lifecycle slice", () => {
    const session = createFacilitatorSession(SESSION_IDENTITY);

    expect(urlOfLastConnection()).toContain("/hub/facilitator");
    expect(session.lifecycle.advancePhase).toBeInstanceOf(Function);
    expect(session.quizControl.revealAnswer).toBeInstanceOf(Function);
  });

  it("connects the presenter anonymously", () => {
    createPresenterSession(SESSION_IDENTITY);

    expect(urlOfLastConnection()).toContain("/hub/presenter");
    expect(createConnection.mock.calls[0][0].accessToken).toBeUndefined();
  });

  it("hands the current access token to authenticated hubs", async () => {
    createParticipantSession(SESSION_IDENTITY);

    const token = createConnection.mock.calls[0][0].accessToken!;

    await expect(firstValueFrom(token)).resolves.toBe("a-token");
  });

  it("escapes a session identity that is not url safe", () => {
    createPresenterSession("a b&c");

    expect(urlOfLastConnection()).toContain("sessionIdentity=a%20b%26c");
  });

  it("starts and closes the underlying connection", () => {
    const fake = fakeConnection();
    createConnection.mockReturnValue(fake.connection);

    const session = createParticipantSession(SESSION_IDENTITY);
    session.start.subscribe();
    session.close.subscribe();

    expect(fake.isStarted()).toBe(true);
    expect(fake.isStopped()).toBe(true);
  });
});
