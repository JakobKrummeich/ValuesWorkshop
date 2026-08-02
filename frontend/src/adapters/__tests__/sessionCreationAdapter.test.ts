import { EMPTY, firstValueFrom, of } from "rxjs";
import {
  SessionCreationFailure,
  type SessionCreationOutcome,
} from "../../domain/sessionCreation";
import { getAccessToken } from "../authAdapter";
import { facilitatorSessionCreation } from "../sessionCreationAdapter";

jest.mock("../authAdapter", () => ({ getAccessToken: jest.fn() }));

const accessToken = getAccessToken as jest.MockedFunction<
  typeof getAccessToken
>;

const SESSION_IDENTITY = "3f1a0f2e-0000-4000-8000-000000000001";

function respondWith(status: number, body?: unknown): jest.Mock {
  const fetchMock = jest.fn(() =>
    Promise.resolve({
      status,
      ok: status >= 200 && status < 300,
      json: () =>
        body === undefined
          ? Promise.reject(new Error("no body"))
          : Promise.resolve(body),
    } as Response),
  );
  global.fetch = fetchMock as unknown as typeof fetch;

  return fetchMock;
}

function openSession(): Promise<SessionCreationOutcome> {
  return firstValueFrom(
    facilitatorSessionCreation.openSession("Herbst 2024", "opensesame"),
  );
}

describe("facilitator session creation port", () => {
  beforeEach(() => {
    accessToken.mockReturnValue(of("token-abc"));
  });

  it("posts the session name and passphrase as a bearer authenticated request", async () => {
    const fetchMock = respondWith(201, { sessionIdentity: SESSION_IDENTITY });

    await openSession();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5000/api/sessions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-abc",
        },
        body: JSON.stringify({
          sessionName: "Herbst 2024",
          passphrase: "opensesame",
        }),
      },
    );
  });

  it("reads the created session identity from the accepted response", async () => {
    respondWith(201, { sessionIdentity: SESSION_IDENTITY });

    await expect(openSession()).resolves.toEqual({
      isCreated: true,
      sessionIdentity: SESSION_IDENTITY,
    });
  });

  it("rejects a created response whose identity is not a uuid", async () => {
    respondWith(201, { sessionIdentity: "not-a-uuid" });

    await expect(openSession()).resolves.toEqual({
      isCreated: false,
      failure: SessionCreationFailure.Unexpected,
    });
  });

  it("reports a refused passphrase without leaking the response", async () => {
    respondWith(401);

    await expect(openSession()).resolves.toEqual({
      isCreated: false,
      failure: SessionCreationFailure.PassphraseRejected,
    });
  });

  it("reports a refused session name", async () => {
    respondWith(400, { title: "Bad Request" });

    await expect(openSession()).resolves.toEqual({
      isCreated: false,
      failure: SessionCreationFailure.SessionNameRejected,
    });
  });

  it("reports any other status as unexpected", async () => {
    respondWith(503);

    await expect(openSession()).resolves.toEqual({
      isCreated: false,
      failure: SessionCreationFailure.Unexpected,
    });
  });

  it("reports an unreachable backend as unexpected", async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error("network down")),
    ) as unknown as typeof fetch;

    await expect(openSession()).resolves.toEqual({
      isCreated: false,
      failure: SessionCreationFailure.Unexpected,
    });
  });

  it("reports a missing access token as not authenticated without calling the backend", async () => {
    const fetchMock = respondWith(201, { sessionIdentity: SESSION_IDENTITY });
    accessToken.mockReturnValue(EMPTY);

    await expect(openSession()).resolves.toEqual({
      isCreated: false,
      failure: SessionCreationFailure.NotAuthenticated,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not reach the backend before the caller subscribes", () => {
    const fetchMock = respondWith(201, { sessionIdentity: SESSION_IDENTITY });

    facilitatorSessionCreation.openSession("Herbst 2024", "opensesame");

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
