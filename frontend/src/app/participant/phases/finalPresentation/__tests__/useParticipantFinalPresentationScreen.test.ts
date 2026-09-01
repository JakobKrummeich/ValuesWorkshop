import { act, renderHook } from "@testing-library/react";
import { NEVER, of, throwError } from "rxjs";
import { downloadBlob } from "../../../../../adapters/fileDownload";
import { renderWorkshopRecordPdf } from "../../../../../adapters/workshopRecordPdf";
import { Language } from "../../../../../domain/i18n/language";
import { MessageKey } from "../../../../../domain/i18n/messages";
import type { ParticipantConclusionView } from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { useParticipantFinalPresentationScreen } from "../useParticipantFinalPresentationScreen";

jest.mock("../../../../../adapters/workshopRecordPdf", () => ({
  renderWorkshopRecordPdf: jest.fn(),
}));

jest.mock("../../../../../adapters/fileDownload", () => ({
  downloadBlob: jest.fn(),
}));

const renderPdf = renderWorkshopRecordPdf as jest.MockedFunction<
  typeof renderWorkshopRecordPdf
>;
const download = downloadBlob as jest.MockedFunction<typeof downloadBlob>;

function concludedView(): ParticipantConclusionView {
  return {
    isConcluded: true,
    record: {
      winners: [
        {
          valueId: "wert-1",
          text: { de: "Vertrauen", en: "Trust" },
          place: 1,
          voteCount: 6,
          actions: ["We name mistakes the day we make them"],
        },
      ],
      values: [
        {
          valueId: "wert-1",
          text: { de: "Vertrauen", en: "Trust" },
          actions: ["We name mistakes the day we make them"],
        },
      ],
      rounds: [
        {
          roundNumber: 1,
          allotment: 5,
          tallies: [{ valueId: "wert-1", count: 6 }],
        },
      ],
    },
  };
}

function renderScreenHook(
  conclusion: ParticipantConclusionView,
  language: Language = Language.English,
) {
  return renderHook(() => useParticipantFinalPresentationScreen(conclusion), {
    wrapper: languageWrapper(language),
  });
}

describe("participant final presentation screen logic", () => {
  afterEach(() => {
    renderPdf.mockReset();
    download.mockReset();
  });

  it("reports an unconcluded workshop while the reveal is running", () => {
    const { result } = renderScreenHook({ isConcluded: false });

    expect(result.current).toEqual({ isConcluded: false });
    expect(renderPdf).not.toHaveBeenCalled();
  });

  it("offers an idle download once the workshop is concluded", () => {
    const { result } = renderScreenHook(concludedView());

    expect(result.current.isConcluded).toBe(true);
    if (!result.current.isConcluded) {
      throw new Error("expected the concluded model");
    }
    expect(result.current.isDownloading).toBe(false);
    expect(result.current.downloadFailedMessage).toBeNull();
  });

  it("downloads the rendered record under the fixed file name", () => {
    const blob = new Blob(["%PDF"], { type: "application/pdf" });
    renderPdf.mockReturnValue(of(blob));
    const { result } = renderScreenHook(concludedView());
    if (!result.current.isConcluded) {
      throw new Error("expected the concluded model");
    }

    act(() => {
      if (result.current.isConcluded) {
        result.current.downloadRecord();
      }
    });

    expect(renderPdf).toHaveBeenCalledTimes(1);
    expect(renderPdf.mock.calls[0][0].title).toBe("Workshop record");
    expect(renderPdf.mock.calls[0][0].winners[0].valueName).toBe("Trust");
    expect(download).toHaveBeenCalledWith(blob, "workshop-record.pdf");
    if (!result.current.isConcluded) {
      throw new Error("expected the concluded model");
    }
    expect(result.current.isDownloading).toBe(false);
  });

  it("builds the record in the active language", () => {
    renderPdf.mockReturnValue(of(new Blob(["%PDF"])));
    const { result } = renderScreenHook(concludedView(), Language.German);

    act(() => {
      if (result.current.isConcluded) {
        result.current.downloadRecord();
      }
    });

    expect(renderPdf.mock.calls[0][0].title).toBe("Workshop-Protokoll");
    expect(renderPdf.mock.calls[0][0].winners[0].valueName).toBe("Vertrauen");
  });

  it("locks the download while the rendering is in flight", () => {
    renderPdf.mockReturnValue(NEVER);
    const { result } = renderScreenHook(concludedView());

    act(() => {
      if (result.current.isConcluded) {
        result.current.downloadRecord();
      }
    });
    act(() => {
      if (result.current.isConcluded) {
        result.current.downloadRecord();
      }
    });

    expect(renderPdf).toHaveBeenCalledTimes(1);
    if (!result.current.isConcluded) {
      throw new Error("expected the concluded model");
    }
    expect(result.current.isDownloading).toBe(true);
  });

  it("surfaces a failure and allows a retry", () => {
    renderPdf.mockReturnValue(throwError(() => new Error("rendering failed")));
    const { result } = renderScreenHook(concludedView());

    act(() => {
      if (result.current.isConcluded) {
        result.current.downloadRecord();
      }
    });

    if (!result.current.isConcluded) {
      throw new Error("expected the concluded model");
    }
    expect(result.current.downloadFailedMessage).toBe(
      MessageKey.FinalPresentationDownloadFailed,
    );
    expect(result.current.isDownloading).toBe(false);

    renderPdf.mockReturnValue(of(new Blob(["%PDF"])));
    act(() => {
      if (result.current.isConcluded) {
        result.current.downloadRecord();
      }
    });

    expect(renderPdf).toHaveBeenCalledTimes(2);
    if (!result.current.isConcluded) {
      throw new Error("expected the concluded model");
    }
    expect(result.current.downloadFailedMessage).toBeNull();
    expect(download).toHaveBeenCalled();
  });
});
