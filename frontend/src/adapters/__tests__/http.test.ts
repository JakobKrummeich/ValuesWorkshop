import { firstValueFrom } from "rxjs";
import { postJson } from "../http";

function respondWith(status: number, body?: unknown): jest.Mock {
  const fetchMock = jest.fn(() =>
    Promise.resolve({
      status,
      ok: status >= 200 && status < 300,
      json: () =>
        body === undefined
          ? Promise.reject(new Error("no body"))
          : Promise.resolve(body),
    } as Response),
  );
  global.fetch = fetchMock as unknown as typeof fetch;

  return fetchMock;
}

function post() {
  return postJson("https://backend.test/api/things", { name: "Herbst" }, "tok");
}

describe("json over http", () => {
  it("posts the body as bearer authenticated json", async () => {
    const fetchMock = respondWith(201, {});

    await firstValueFrom(post());

    expect(fetchMock).toHaveBeenCalledWith("https://backend.test/api/things", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer tok",
      },
      body: JSON.stringify({ name: "Herbst" }),
    });
  });

  it("emits the status together with the parsed body", async () => {
    respondWith(201, { identity: "abc" });

    await expect(firstValueFrom(post())).resolves.toEqual({
      status: 201,
      body: { identity: "abc" },
    });
  });

  it("emits an undefined body when the response carries no json", async () => {
    respondWith(401);

    await expect(firstValueFrom(post())).resolves.toEqual({
      status: 401,
      body: undefined,
    });
  });

  it("does not reach the network before the caller subscribes", () => {
    const fetchMock = respondWith(201, {});

    post();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails the stream when the request never reaches the backend", async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error("network down")),
    ) as unknown as typeof fetch;

    await expect(firstValueFrom(post())).rejects.toThrow("network down");
  });
});
