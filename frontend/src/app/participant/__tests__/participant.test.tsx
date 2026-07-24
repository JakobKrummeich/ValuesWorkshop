import { render, screen, act } from "@testing-library/react";
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

describe("participant screen group", () => {
  it("receives its gateway through its own dependency context", async () => {
    await act(async () => {
      render(
        <ParticipantLayout>
          <ParticipantHome />
        </ParticipantLayout>,
      );
    });

    screen.getByText("stub-session", { exact: false });
  });
});
