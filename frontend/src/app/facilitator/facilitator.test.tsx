import { render, screen, act } from "@testing-library/react";
import FacilitatorLayout from "./layout";
import FacilitatorHome from "./page";

jest.mock("../../adapters/authAdapter", () => ({
  getAuthenticatedUser: jest.fn().mockResolvedValue({
    access_token: "test-token",
    expired: false,
  }),
  loginRedirect: jest.fn(),
}));

describe("facilitator screen group", () => {
  it("receives its gateway through its own dependency context", async () => {
    await act(async () => {
      render(
        <FacilitatorLayout>
          <FacilitatorHome />
        </FacilitatorLayout>,
      );
    });

    screen.getByText("stub-session", { exact: false });
  });
});
