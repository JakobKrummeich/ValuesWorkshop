import { render, screen, act } from "@testing-library/react";
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
