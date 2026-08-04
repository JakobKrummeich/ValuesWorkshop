import { copyToClipboard } from "../clipboard";

const writeText = jest.fn();

beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  writeText.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("clipboard", () => {
  it("copies nothing before anyone subscribes", () => {
    copyToClipboard("https://example.test/participant");

    expect(writeText).not.toHaveBeenCalled();
  });

  it("completes once the text is on the clipboard", async () => {
    const completed = jest.fn();

    await new Promise<void>((resolve) => {
      copyToClipboard("https://example.test/participant").subscribe({
        complete() {
          completed();
          resolve();
        },
      });
    });

    expect(writeText).toHaveBeenCalledWith("https://example.test/participant");
    expect(completed).toHaveBeenCalled();
  });

  it("reports a clipboard the browser refused", async () => {
    writeText.mockRejectedValue(new Error("denied"));

    const failure = await new Promise<Error>((resolve) => {
      copyToClipboard("anything").subscribe({ error: resolve });
    });

    expect(failure.message).toBe("denied");
  });
});
