import { render, screen } from "@testing-library/react";
import { MessageKey } from "../../../domain/i18n/messages";
import { languageWrapper } from "../../../testing/languageWrapper";
import { IntentRejection } from "../IntentRejection";

describe("IntentRejection", () => {
  it("renders nothing while there is no rejection", () => {
    render(<IntentRejection message={null} />, { wrapper: languageWrapper() });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("announces the translated rejection as a status", () => {
    render(<IntentRejection message={MessageKey.IntentWrongPhase} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      "That is not possible in this phase.",
    );
  });
});
