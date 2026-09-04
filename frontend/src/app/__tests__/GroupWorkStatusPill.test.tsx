import { render, screen } from "@testing-library/react";
import { Language } from "../../domain/i18n/language";
import { GroupWorkStatus } from "../../domain/workshopState";
import { languageWrapper } from "../../testing/languageWrapper";
import { GroupWorkStatusPill } from "../GroupWorkStatusPill";

describe("group work status pill", () => {
  it("pulses as editing without a check", () => {
    const { container } = render(
      <GroupWorkStatusPill
        workStatus={GroupWorkStatus.Editing}
        testId="status"
      />,
      { wrapper: languageWrapper() },
    );

    expect(screen.getByTestId("status")).toHaveTextContent(/^Editing$/);
    expect(screen.getByTestId("status")).toHaveClass("editing");
    expect(container.querySelector("svg")).toBeNull();
  });

  it("shows submitted with a check", () => {
    const { container } = render(
      <GroupWorkStatusPill
        workStatus={GroupWorkStatus.Submitted}
        testId="status"
      />,
      { wrapper: languageWrapper() },
    );

    expect(screen.getByTestId("status")).toHaveTextContent(/^Submitted$/);
    expect(screen.getByTestId("status")).toHaveClass("submitted");
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("speaks German when German is chosen", () => {
    render(
      <GroupWorkStatusPill
        workStatus={GroupWorkStatus.Submitted}
        testId="status"
      />,
      { wrapper: languageWrapper(Language.German) },
    );

    expect(screen.getByTestId("status")).toHaveTextContent("Abgegeben");
  });
});
