import { pdf } from "@react-pdf/renderer";
import { firstValueFrom } from "rxjs";
import type { WorkshopRecordModel } from "../../domain/workshopRecordModel";
import { WorkshopRecordDocument } from "../WorkshopRecordDocument";
import { renderWorkshopRecordPdf } from "../workshopRecordPdf";

jest.mock("@react-pdf/renderer", () => ({ pdf: jest.fn() }));

jest.mock("../WorkshopRecordDocument", () => ({
  WorkshopRecordDocument: jest.fn(() => null),
}));

const pdfMock = pdf as jest.MockedFunction<typeof pdf>;

function recordModel(): WorkshopRecordModel {
  return {
    title: "Workshop record",
    winnersHeading: "The winners",
    winners: [],
    allActionsHeading: "All actions",
    values: [],
    roundsHeading: "Votes per round",
    rounds: [],
  };
}

describe("renderWorkshopRecordPdf", () => {
  afterEach(() => pdfMock.mockReset());

  it("renders nothing before a subscription arrives", () => {
    renderWorkshopRecordPdf(recordModel());

    expect(pdfMock).not.toHaveBeenCalled();
  });

  it("renders the record document into a blob", async () => {
    const blob = new Blob(["%PDF"], { type: "application/pdf" });
    pdfMock.mockReturnValue({
      toBlob: () => Promise.resolve(blob),
    } as unknown as ReturnType<typeof pdf>);
    const model = recordModel();

    const emitted = await firstValueFrom(renderWorkshopRecordPdf(model));

    expect(emitted).toBe(blob);
    const element = pdfMock.mock.calls[0][0];
    expect(element?.type).toBe(WorkshopRecordDocument);
    expect(element?.props).toEqual({ model });
  });

  it("propagates a rendering failure as an error", async () => {
    pdfMock.mockReturnValue({
      toBlob: () => Promise.reject(new Error("rendering failed")),
    } as unknown as ReturnType<typeof pdf>);

    await expect(
      firstValueFrom(renderWorkshopRecordPdf(recordModel())),
    ).rejects.toThrow("rendering failed");
  });
});
