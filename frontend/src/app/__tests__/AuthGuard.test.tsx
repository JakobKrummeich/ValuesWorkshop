import { render, screen } from "@testing-library/react";
import { AuthGuard } from "../AuthGuard";
import { AuthGuardState } from "../useAuthGuard";

const mockUseAuthGuard = jest.fn();

jest.mock("../useAuthGuard", () => ({
  useAuthGuard: (...args: unknown[]) => mockUseAuthGuard(...args),
  AuthGuardState: {
    Checking: "checking",
    Authenticated: "authenticated",
    Redirecting: "redirecting",
    Error: "error",
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("AuthGuard", () => {
  it("shows checking message while auth state is checking", () => {
    mockUseAuthGuard.mockReturnValue({ state: AuthGuardState.Checking });

    render(
      <AuthGuard>
        <p>Protected content</p>
      </AuthGuard>,
    );

    screen.getByText("Checking authentication…");
    expect(screen.queryByText("Protected content")).toBeNull();
  });

  it("renders children when authenticated", () => {
    mockUseAuthGuard.mockReturnValue({ state: AuthGuardState.Authenticated });

    render(
      <AuthGuard>
        <p>Protected content</p>
      </AuthGuard>,
    );

    screen.getByText("Protected content");
  });

  it("shows redirecting message when redirecting", () => {
    mockUseAuthGuard.mockReturnValue({ state: AuthGuardState.Redirecting });

    render(
      <AuthGuard>
        <p>Protected content</p>
      </AuthGuard>,
    );

    screen.getByText("Redirecting to login…");
    expect(screen.queryByText("Protected content")).toBeNull();
  });

  it("shows error message on auth error", () => {
    mockUseAuthGuard.mockReturnValue({ state: AuthGuardState.Error });

    render(
      <AuthGuard>
        <p>Protected content</p>
      </AuthGuard>,
    );

    screen.getByText(
      "Unable to connect to the login provider. Please try again later.",
    );
    expect(screen.queryByText("Protected content")).toBeNull();
  });
});
