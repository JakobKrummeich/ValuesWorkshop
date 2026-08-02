import { render, screen, act } from "@testing-library/react";
import { EMPTY, Subject, of } from "rxjs";
import { ConnectionState } from "../../../domain/connectionState";
import { Phase } from "../../../domain/phases";
import type { FacilitatorWorkshopState } from "../../../domain/workshopState";
import { currentSessionIdentity } from "../../../adapters/browserLocation";
import { createFacilitatorSession } from "../../../adapters/workshopSessions";
import FacilitatorLayout from "../layout";
import FacilitatorHome from "../page";

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
  ...jest.requireActual("../../../adapters/browserLocation"),
  currentSessionIdentity: jest.fn(),
}));
jest.mock("../../../adapters/workshopSessions", () => ({
  createFacilitatorSession: jest.fn(),
}));

const sessionIdentity = currentSessionIdentity as jest.MockedFunction<
  typeof currentSessionIdentity
>;
const createSession = createFacilitatorSession as jest.MockedFunction<
  typeof createFacilitatorSession
>;

const workshopState = new Subject<FacilitatorWorkshopState>();
const advancePhase = jest.fn(() => EMPTY);

beforeEach(() => {
  sessionIdentity.mockReturnValue("session-7");
  createSession.mockReturnValue({
    sessionState: {
      workshopState,
      connectionState: of(ConnectionState.Connected),
    },
    lifecycle: { advancePhase },
    start: EMPTY,
    close: EMPTY,
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("facilitator screen group", () => {
  it("renders its own state and offers the lifecycle control", async () => {
    await act(async () => {
      render(
        <FacilitatorLayout>
          <FacilitatorHome />
        </FacilitatorLayout>,
      );
    });

    act(() => {
      workshopState.next({
        revision: 4,
        phase: Phase.GroupWork,
      } as FacilitatorWorkshopState);
    });

    expect(screen.getByTestId("phase")).toHaveTextContent("Phase 6");
    screen.getByRole("button", { name: "Advance phase" });
  });

  it("offers the open session form when the link carries no session", async () => {
    sessionIdentity.mockReturnValue(null);

    await act(async () => {
      render(
        <FacilitatorLayout>
          <FacilitatorHome />
        </FacilitatorLayout>,
      );
    });

    screen.getByRole("heading", { name: "ValuesWorkshop · Open a session" });
    screen.getByLabelText("Facilitator passphrase");
    expect(createSession).not.toHaveBeenCalled();
    expect(screen.queryByText(/no workshop session/i)).not.toBeInTheDocument();
  });
});
