import { render, screen, act, waitFor } from "@testing-library/react";
import AuthCallbackPage from "./page";

const mockHandleCallback = jest.fn();
const mockNavigateReplace = jest.fn();

jest.mock("../../../adapters/authAdapter", () => ({
  handleCallback: (...args: unknown[]) => mockHandleCallback(...args),
  navigateReplace: (...args: unknown[]) => mockNavigateReplace(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("AuthCallbackPage", () => {
  it("shows loading state during callback processing", () => {
    mockHandleCallback.mockReturnValue(new Promise(() => {}));

    render(<AuthCallbackPage />);

    screen.getByText("Completing login…");
  });

  it("redirects to stored return URL after successful callback", async () => {
    mockHandleCallback.mockResolvedValue({
      state: "/facilitator",
      access_token: "test-token",
    });

    await act(async () => {
      render(<AuthCallbackPage />);
    });

    await waitFor(() => {
      expect(mockNavigateReplace).toHaveBeenCalledWith("/facilitator");
    });
  });

  it("redirects to root when no return URL in state", async () => {
    mockHandleCallback.mockResolvedValue({
      access_token: "test-token",
    });

    await act(async () => {
      render(<AuthCallbackPage />);
    });

    await waitFor(() => {
      expect(mockNavigateReplace).toHaveBeenCalledWith("/");
    });
  });

  it("shows error message on callback failure", async () => {
    mockHandleCallback.mockRejectedValue(new Error("Invalid state"));

    await act(async () => {
      render(<AuthCallbackPage />);
    });

    await waitFor(() => {
      screen.getByText("Authentication error: Invalid state");
    });
    screen.getByText("Return to home");
  });
});
