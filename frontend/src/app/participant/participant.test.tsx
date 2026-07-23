import { render, screen, act } from "@testing-library/react";
import ParticipantLayout from "./layout";
import ParticipantHome from "./page";

jest.mock("../../adapters/authAdapter", () => ({
  getAuthenticatedUser: jest.fn().mockResolvedValue({
    access_token: "test-token",
    expired: false,
  }),
  loginRedirect: jest.fn(),
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
