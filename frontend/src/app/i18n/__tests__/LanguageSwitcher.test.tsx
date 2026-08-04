import { fireEvent, render, screen } from "@testing-library/react";
import { Language } from "../../../domain/i18n/language";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { useLanguageSwitcher } from "../useLanguageSwitcher";

jest.mock("../useLanguageSwitcher");

const useLanguageSwitcherMock = jest.mocked(useLanguageSwitcher);

describe("the language switcher", () => {
  it("renders one pressable choice per language", () => {
    const selectLanguage = jest.fn();
    useLanguageSwitcherMock.mockReturnValue({
      label: "Sprache",
      choices: [
        { language: Language.German, label: "Deutsch", isSelected: true },
        { language: Language.English, label: "Englisch", isSelected: false },
      ],
      selectLanguage,
    });

    render(<LanguageSwitcher />);

    expect(screen.getByRole("group", { name: "Sprache" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Deutsch" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "Englisch" }));

    expect(selectLanguage).toHaveBeenCalledWith(Language.English);
  });
});
