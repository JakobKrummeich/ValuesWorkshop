import { render, screen, act } from "@testing-library/react";
import { EMPTY, Subject, of } from "rxjs";
import { ConnectionState } from "../../../domain/connectionState";
import { Phase } from "../../../domain/phases";
import type { ParticipantWorkshopState } from "../../../domain/workshopState";
import { QuizSubState } from "../../../domain/workshopState";
import { currentSessionIdentity } from "../../../adapters/browserLocation";
import { createParticipantSession } from "../../../adapters/workshopSessions";
import { languageWrapper } from "../../../testing/languageWrapper";
import ParticipantLayout from "../layout";
import ParticipantHome from "../page";

jest.mock("../../useAuthGuard", () => ({
  useAuthGuard: () => ({ state: "authenticated" }),
  AuthGuardState: {
    Checking: "checking",
    Authenticated: "authenticated",
    Redirecting: "redirecting",
    Error: "error",
  },
}));
jest.mock("../../../adapters/browserLocation", () => ({
  currentSessionIdentity: jest.fn(),
}));
jest.mock("../../../adapters/workshopSessions", () => ({
  createParticipantSession: jest.fn(),
}));

const sessionIdentity = currentSessionIdentity as jest.MockedFunction<
  typeof currentSessionIdentity
>;
const createSession = createParticipantSession as jest.MockedFunction<
  typeof createParticipantSession
>;

const workshopState = new Subject<ParticipantWorkshopState>();

beforeEach(() => {
  sessionIdentity.mockReturnValue("session-7");
  createSession.mockReturnValue({
    sessionStatePort: {
      workshopState,
      connectionState: of(ConnectionState.Connected),
    },
    quizPort: { chooseAnswer: jest.fn(() => EMPTY) },
    selectionPort: { submitSelection: jest.fn(() => EMPTY) },
    start: EMPTY,
    close: EMPTY,
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

async function renderScreen() {
  await act(async () => {
    render(
      <ParticipantLayout>
        <ParticipantHome />
      </ParticipantLayout>,
      { wrapper: languageWrapper() },
    );
  });
}

describe("participant screen group", () => {
  it("renders the state its own session-bound port delivers", async () => {
    await renderScreen();

    act(() => {
      workshopState.next({
        revision: 1,
        phase: Phase.Quiz,
        participantCount: 3,
        quiz: {
          questionIndex: 0,
          questionCount: 3,
          subState: QuizSubState.Answering,
          question: { de: "Wie viele?", en: "How many?" },
          answers: [
            { de: "Eins", en: "One" },
            { de: "Zwei", en: "Two" },
            { de: "Drei", en: "Three" },
          ],
          ownAnswerIndex: null,
        },
      });
    });

    expect(createSession).toHaveBeenCalledWith("session-7");
    expect(screen.getByTestId("phase")).toHaveTextContent("Phase 2");
    expect(screen.getByTestId("connection")).toHaveTextContent("Connected");
  });

  it("shows the lobby while the workshop is in the join phase", async () => {
    await renderScreen();

    act(() => {
      workshopState.next({
        revision: 1,
        phase: Phase.Join,
        participantCount: 3,
        ownDisplayName: "Ada Lovelace",
      });
    });

    expect(screen.getByTestId("own-display-name")).toHaveTextContent(
      "Ada Lovelace",
    );
    expect(screen.getByTestId("participant-count")).toHaveTextContent(
      "Participants: 3",
    );
  });

  it("shows the waiting screen while the selection results are on the wall", async () => {
    await renderScreen();

    act(() => {
      workshopState.next({
        revision: 9,
        phase: Phase.SelectionResults,
        participantCount: 3,
        selection: {
          values: [{ valueId: "mut", text: { de: "Mut", en: "Courage" } }],
          ownSelectedValueIds: ["mut"],
          isSubmitted: true,
          selectionTallies: { mut: 3 },
          topValueIds: ["mut"],
        },
      });
    });

    expect(screen.getByTestId("waiting-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("results-heading")).not.toBeInTheDocument();
  });

  it("explains a link that carries no session", async () => {
    sessionIdentity.mockReturnValue(null);

    await renderScreen();

    screen.getByText("This link carries no workshop session.", {
      exact: false,
    });
    expect(createSession).not.toHaveBeenCalled();
  });
});
