import { render, screen } from "@testing-library/react";
import { EMPTY } from "rxjs";
import { currentSessionIdentity } from "../../adapters/browserLocation";
import type { WorkshopSession } from "../../adapters/workshopSessions";
import { languageWrapper } from "../../testing/languageWrapper";
import { SessionBoundary } from "../SessionBoundary";

jest.mock("../../adapters/browserLocation", () => ({
  currentSessionIdentity: jest.fn(),
}));

const sessionIdentity = currentSessionIdentity as jest.MockedFunction<
  typeof currentSessionIdentity
>;

interface FakeSession extends WorkshopSession {
  identity: string;
}

function createFakeSession(identity: string): FakeSession {
  return { identity, start: EMPTY, close: EMPTY };
}

describe("SessionBoundary", () => {
  it("explains a link that carries no session identity", () => {
    sessionIdentity.mockReturnValue(null);

    render(
      <SessionBoundary createSession={createFakeSession}>
        {(session) => <p>{session.identity}</p>}
      </SessionBoundary>,
      { wrapper: languageWrapper() },
    );

    expect(screen.getByText(/no workshop session/i)).toBeInTheDocument();
  });

  it("renders the screen's own fallback for a link that carries no session", () => {
    sessionIdentity.mockReturnValue(null);

    render(
      <SessionBoundary
        createSession={createFakeSession}
        missingSession={<p>Open a session</p>}
      >
        {(session) => <p>{session.identity}</p>}
      </SessionBoundary>,
      { wrapper: languageWrapper() },
    );

    expect(screen.getByText("Open a session")).toBeInTheDocument();
    expect(screen.queryByText(/no workshop session/i)).not.toBeInTheDocument();
  });

  it("renders its children with the session bound to the link", () => {
    sessionIdentity.mockReturnValue("abc-123");

    render(
      <SessionBoundary createSession={createFakeSession}>
        {(session) => <p>{session.identity}</p>}
      </SessionBoundary>,
      { wrapper: languageWrapper() },
    );

    expect(screen.getByText("abc-123")).toBeInTheDocument();
  });
});
