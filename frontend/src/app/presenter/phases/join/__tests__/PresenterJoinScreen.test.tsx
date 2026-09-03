import { render, screen, within } from "@testing-library/react";
import { Language } from "../../../../../domain/i18n/language";
import { Phase } from "../../../../../domain/phases";
import type { PresenterJoinState } from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { PresenterJoinScreen } from "../PresenterJoinScreen";
import {
  type PresenterJoinScreenModel,
  usePresenterJoinScreen,
} from "../usePresenterJoinScreen";

jest.mock("../usePresenterJoinScreen", () => ({
  usePresenterJoinScreen: jest.fn(),
}));

const joinScreen = usePresenterJoinScreen as jest.MockedFunction<
  typeof usePresenterJoinScreen
>;

const JOIN_URL = "https://workshop.test/participant?sessionIdentity=abc-123";

function lobby(displayNames: string[]): PresenterJoinState {
  return {
    revision: 2,
    phase: Phase.Join,
    participantCount: displayNames.length,
    participantDisplayNames: displayNames,
  };
}

function model(
  overrides: Partial<PresenterJoinScreenModel> = {},
): PresenterJoinScreenModel {
  return {
    joinUrl: JOIN_URL,
    pingKey: 0,
    visibleNames: [],
    hiddenCount: 0,
    ...overrides,
  };
}

function renderWith(
  screenModel: PresenterJoinScreenModel,
  displayNames: string[] = screenModel.visibleNames.map(({ name }) => name),
  language = Language.English,
) {
  joinScreen.mockReturnValue(screenModel);

  return render(<PresenterJoinScreen state={lobby(displayNames)} />, {
    wrapper: languageWrapper(language),
  });
}

afterEach(() => {
  jest.clearAllMocks();
});

describe("presenter join screen", () => {
  it("shows a QR code of the participant join url and no readable url", () => {
    renderWith(model());

    screen.getByTitle("Scan to join");
    expect(screen.queryByText(/workshop\.test/)).not.toBeInTheDocument();
  });

  it("lists everyone who has joined so far and counts them", () => {
    renderWith(
      model({
        visibleNames: [
          { name: "Ada Lovelace", isNewest: false },
          { name: "Alan Turing", isNewest: true },
        ],
      }),
    );

    const names = within(screen.getByTestId("joined-names")).getAllByRole(
      "listitem",
    );
    expect(names.map((name) => name.textContent)).toEqual([
      "Ada Lovelace",
      "Alan Turing",
    ]);
    expect(names[0]).toHaveStyle({ "--index": "0" });
    expect(names[1]).toHaveStyle({ "--index": "1" });
    expect(names[0].className).not.toMatch(/newest/);
    expect(names[1].className).toMatch(/newest/);
    expect(screen.getByTestId("participant-count")).toHaveTextContent(
      "Participants: 2",
    );
    expect(screen.getByText("joined")).toBeInTheDocument();
  });

  it("folds the names beyond the cap into one more-pill", () => {
    renderWith(
      model({
        visibleNames: [{ name: "Ada", isNewest: false }],
        hiddenCount: 9,
      }),
      Array.from({ length: 10 }, () => "Ada"),
    );

    expect(screen.getByTestId("joined-names")).toHaveTextContent("+9 more");
  });

  it("says so while nobody has joined", () => {
    renderWith(model());

    screen.getByText("Nobody has joined yet");
    expect(screen.queryByTestId("joined-names")).not.toBeInTheDocument();
  });

  it("pings the QR card once someone has joined, never on arrival", () => {
    const { rerender } = renderWith(model());

    expect(screen.queryByTestId("join-ping")).not.toBeInTheDocument();

    joinScreen.mockReturnValue(model({ pingKey: 1 }));
    rerender(<PresenterJoinScreen state={lobby([])} />);

    expect(screen.getByTestId("join-ping")).toBeInTheDocument();
  });

  it("shows no QR code while the link carries no session", () => {
    renderWith(model({ joinUrl: null }));

    expect(screen.queryByTitle("Scan to join")).not.toBeInTheDocument();
  });

  it("speaks German when German is chosen", () => {
    renderWith(
      model({
        visibleNames: [{ name: "Ada", isNewest: false }],
        hiddenCount: 2,
      }),
      ["Ada", "Grace", "Linus"],
      Language.German,
    );

    screen.getByTitle("Zum Mitmachen scannen");
    expect(screen.getByTestId("joined-names")).toHaveTextContent("+2 weitere");
    expect(screen.getByTestId("participant-count")).toHaveTextContent(
      "Teilnehmende: 3",
    );
    expect(screen.getByText("dabei")).toBeInTheDocument();
  });
});
