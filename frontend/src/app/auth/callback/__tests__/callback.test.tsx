import { render, screen } from "@testing-library/react";
import { languageWrapper } from "../../../../testing/languageWrapper";
import AuthCallbackPage from "../page";

const mockUseAuthCallback = jest.fn();

jest.mock("../useAuthCallback", () => ({
  useAuthCallback: (...args: unknown[]) => mockUseAuthCallback(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("AuthCallbackPage", () => {
  it("shows loading state when no error", () => {
    mockUseAuthCallback.mockReturnValue({ error: null });

    render(<AuthCallbackPage />, { wrapper: languageWrapper() });

    screen.getByText("Completing login…");
  });

  it("shows error message and return link on error", () => {
    mockUseAuthCallback.mockReturnValue({ error: "Invalid state" });

    render(<AuthCallbackPage />, { wrapper: languageWrapper() });

    screen.getByText("Authentication error: Invalid state");
    screen.getByText("Return to home");
  });
});
