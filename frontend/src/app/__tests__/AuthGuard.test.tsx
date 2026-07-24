import { render, screen, act, waitFor } from "@testing-library/react";
import { AuthGuard } from "../AuthGuard";

const mockGetAuthenticatedUser = jest.fn();
const mockLoginRedirect = jest.fn();

jest.mock("../../adapters/authAdapter", () => ({
  getAuthenticatedUser: (...args: unknown[]) =>
    mockGetAuthenticatedUser(...args),
  loginRedirect: (...args: unknown[]) => mockLoginRedirect(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockLoginRedirect.mockResolvedValue(undefined);
});

describe("AuthGuard", () => {
  it("shows loading state while checking authentication", () => {
    mockGetAuthenticatedUser.mockReturnValue(new Promise(() => {}));

    render(
      <AuthGuard>
        <p>Protected content</p>
      </AuthGuard>,
    );

    screen.getByText("Checking authentication…");
    expect(screen.queryByText("Protected content")).toBeNull();
  });

  it("renders children when user is authenticated", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      access_token: "test-token",
      expired: false,
    });

    await act(async () => {
      render(
        <AuthGuard>
          <p>Protected content</p>
        </AuthGuard>,
      );
    });

    screen.getByText("Protected content");
  });

  it("redirects to login when user is not authenticated", async () => {
    mockGetAuthenticatedUser.mockResolvedValue(null);

    await act(async () => {
      render(
        <AuthGuard>
          <p>Protected content</p>
        </AuthGuard>,
      );
    });

    await waitFor(() => {
      expect(mockLoginRedirect).toHaveBeenCalledWith(window.location.pathname);
    });
    expect(screen.queryByText("Protected content")).toBeNull();
    screen.getByText("Redirecting to login…");
  });
});
