import { lastValueFrom } from "rxjs";

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
    await lastValueFrom(copyToClipboard("https://example.test/participant"), {
      defaultValue: undefined,
    });

    expect(writeText).toHaveBeenCalledWith("https://example.test/participant");
  });

  it("reports a clipboard the browser refused", async () => {
    writeText.mockRejectedValue(new Error("denied"));

    await expect(
      lastValueFrom(copyToClipboard("anything"), { defaultValue: undefined }),
    ).rejects.toThrow("denied");
  });
});
