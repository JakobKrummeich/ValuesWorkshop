import { render, screen } from "@testing-library/react";
import { ConnectionState } from "../../../domain/connectionState";
import { ConnectionStatus, ConnectionStatusVariant } from "../ConnectionStatus";
import { useConnectionStatus } from "../useConnectionStatus";

jest.mock("../useConnectionStatus", () => ({
  useConnectionStatus: jest.fn(),
}));

const status = jest.mocked(useConnectionStatus);

describe("connection status", () => {
  it.each(Object.values(ConnectionStatusVariant))(
    "renders exactly the connection text under the e2e contract as %s",
    (variant) => {
      status.mockReturnValue({ text: "Connected", isConnected: true });

      render(
        <ConnectionStatus
          connectionState={ConnectionState.Connected}
          variant={variant}
        />,
      );

      expect(screen.getByTestId("connection")).toHaveTextContent(/^Connected$/);
      expect(screen.getByRole("status")).toHaveTextContent(/^Connected$/);
    },
  );

  it("keeps the text in the document while the wall hides a healthy connection", () => {
    status.mockReturnValue({ text: "Connected", isConnected: true });

    render(
      <ConnectionStatus
        connectionState={ConnectionState.Connected}
        variant={ConnectionStatusVariant.Wall}
      />,
    );

    expect(screen.getByRole("status").className).toContain("connected");
  });

  it("marks an unhealthy connection", () => {
    status.mockReturnValue({ text: "Reconnecting", isConnected: false });

    render(
      <ConnectionStatus
        connectionState={ConnectionState.Reconnecting}
        variant={ConnectionStatusVariant.Wall}
      />,
    );

    expect(screen.getByTestId("connection")).toHaveTextContent(
      /^Reconnecting$/,
    );
    expect(screen.getByRole("status").className).toContain("unhealthy");
  });
});
