import { render, screen } from "@testing-library/react";
import { EntryNotice } from "../EntryNotice";

describe("entry notice", () => {
  it("shows a single calm line when there is no heading", () => {
    render(<EntryNotice body="Checking authentication…" />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Checking authentication…",
    );
    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("shows heading and body copy over the aurora", () => {
    render(
      <EntryNotice
        heading="No session in this link"
        body="Please scan the QR code on the wall again."
      />,
    );

    screen.getByRole("heading", { name: "No session in this link" });
    screen.getByText("Please scan the QR code on the wall again.");
  });
});
