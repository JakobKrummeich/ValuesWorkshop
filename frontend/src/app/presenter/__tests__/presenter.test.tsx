import { render, screen, act } from "@testing-library/react";
import { EMPTY, Subject, of } from "rxjs";
import { ConnectionState } from "../../../domain/connectionState";
import { Phase } from "../../../domain/phases";
import type { PresenterWorkshopState } from "../../../domain/workshopState";
import { currentSessionIdentity } from "../../../adapters/browserLocation";
import { createPresenterSession } from "../../../adapters/workshopSessions";
import { languageWrapper } from "../../../testing/languageWrapper";
import PresenterLayout from "../layout";
import PresenterHome from "../page";

jest.mock("../../../adapters/browserLocation", () => ({
  ...jest.requireActual("../../../adapters/browserLocation"),
  currentSessionIdentity: jest.fn(),
}));
jest.mock("../../../adapters/workshopSessions", () => ({
  createPresenterSession: jest.fn(),
}));

const sessionIdentity = currentSessionIdentity as jest.MockedFunction<
  typeof currentSessionIdentity
>;
const createSession = createPresenterSession as jest.MockedFunction<
  typeof createPresenterSession
>;

const workshopState = new Subject<PresenterWorkshopState>();

beforeEach(() => {
  sessionIdentity.mockReturnValue("session-7");
  createSession.mockReturnValue({
    sessionStatePort: {
      workshopState,
      connectionState: of(ConnectionState.Reconnecting),
    },
    start: EMPTY,
    close: EMPTY,
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("presenter screen group", () => {
  it("renders its anonymous state without asking for a login", async () => {
    await act(async () => {
      render(
        <PresenterLayout>
          <PresenterHome />
        </PresenterLayout>,
        { wrapper: languageWrapper() },
      );
    });

    act(() => {
      workshopState.next({
        revision: 2,
        phase: Phase.Join,
        participantCount: 1,
        participantDisplayNames: ["Ada Lovelace"],
      });
    });

    expect(screen.getByTestId("phase")).toHaveTextContent("Phase 1");
    expect(screen.getByTestId("connection")).toHaveTextContent("Reconnecting");
    expect(screen.getByTestId("joined-names")).toHaveTextContent(
      "Ada Lovelace",
    );
  });

  it("carries no heading and no language switcher on the wall", async () => {
    await act(async () => {
      render(
        <PresenterLayout>
          <PresenterHome />
        </PresenterLayout>,
        { wrapper: languageWrapper() },
      );
    });

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });
});
