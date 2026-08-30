import { render, screen } from "@testing-library/react";
import { Language } from "../../../../../domain/i18n/language";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { PresenterFinalVotingScreen } from "../PresenterFinalVotingScreen";

describe("presenter final voting screen", () => {
  it("shows the calm voting message without any tallies", () => {
    render(<PresenterFinalVotingScreen />, { wrapper: languageWrapper() });

    const rendered = screen.getByTestId("presenter-final-voting-screen");
    expect(rendered).toHaveTextContent("Voting ongoing…");
    expect(rendered).toHaveTextContent(
      "Cast your votes on your phone — secret & anonymous",
    );
  });

  it("speaks German when German is chosen", () => {
    render(<PresenterFinalVotingScreen />, {
      wrapper: languageWrapper(Language.German),
    });

    expect(
      screen.getByTestId("presenter-final-voting-screen"),
    ).toHaveTextContent("Abstimmung läuft …");
  });
});
