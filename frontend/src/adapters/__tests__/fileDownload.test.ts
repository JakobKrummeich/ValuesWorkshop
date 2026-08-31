import { downloadBlob } from "../fileDownload";

describe("downloadBlob", () => {
  const createObjectUrl = jest.fn(() => "blob:workshop-record");
  const revokeObjectUrl = jest.fn();
  let click: jest.SpyInstance;

  beforeEach(() => {
    Object.defineProperty(URL, "createObjectURL", {
      value: createObjectUrl,
      configurable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      value: revokeObjectUrl,
      configurable: true,
    });
    click = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    createObjectUrl.mockClear();
    revokeObjectUrl.mockClear();
  });

  it("clicks a temporary anchor that names the file", () => {
    const blob = new Blob(["%PDF"], { type: "application/pdf" });

    downloadBlob(blob, "workshop-record.pdf");

    expect(createObjectUrl).toHaveBeenCalledWith(blob);
    expect(click).toHaveBeenCalledTimes(1);
    const anchor = click.mock.contexts[0] as HTMLAnchorElement;
    expect(anchor.getAttribute("href")).toBe("blob:workshop-record");
    expect(anchor.download).toBe("workshop-record.pdf");
  });

  it("revokes the object url only after the download had time to start", () => {
    jest.useFakeTimers();

    downloadBlob(new Blob(["%PDF"]), "workshop-record.pdf");

    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).not.toHaveBeenCalled();

    jest.advanceTimersByTime(10_000);

    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:workshop-record");
    jest.useRealTimers();
  });
});
