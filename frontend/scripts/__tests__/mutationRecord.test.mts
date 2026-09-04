import {
  MutationSide,
  parseMutationRecord,
  recordMeasurement,
  renderMutationRecord,
  type MutationMeasurement,
} from "../quality/mutation/mutationRecord.mts";

const backendMeasurement: MutationMeasurement = {
  tool: "Stryker.NET 4.16.0",
  command: "pnpm mutation:backend",
  commit: "fd3cb1bee884e8679c0de08042e0da7c724593c0",
  measuredAt: "2026-09-04T13:00:00.000Z",
  score: 75.41,
  killed: 46,
  survived: 13,
  timeout: 0,
  noCoverage: 2,
};

const frontendMeasurement: MutationMeasurement = {
  ...backendMeasurement,
  tool: "StrykerJS 10.0.0",
  command: "pnpm mutation:frontend",
  score: 81.25,
};

describe("recordMeasurement", () => {
  it("keeps the side that was not measured in this run", () => {
    expect(
      recordMeasurement(
        { backend: backendMeasurement },
        MutationSide.Frontend,
        frontendMeasurement,
      ),
    ).toEqual({
      frontend: frontendMeasurement,
      backend: backendMeasurement,
    });
  });

  it("replaces the measurement of the side that was just measured", () => {
    expect(
      recordMeasurement(
        { backend: { ...backendMeasurement, score: 10 } },
        MutationSide.Backend,
        backendMeasurement,
      ),
    ).toEqual({ backend: backendMeasurement });
  });

  it("writes the sides in the same order whichever ran first", () => {
    const frontendFirst = recordMeasurement(
      recordMeasurement({}, MutationSide.Frontend, frontendMeasurement),
      MutationSide.Backend,
      backendMeasurement,
    );
    const backendFirst = recordMeasurement(
      recordMeasurement({}, MutationSide.Backend, backendMeasurement),
      MutationSide.Frontend,
      frontendMeasurement,
    );
    expect(renderMutationRecord(frontendFirst)).toEqual(
      renderMutationRecord(backendFirst),
    );
  });
});

describe("renderMutationRecord", () => {
  it("reads back as the record it rendered", () => {
    const record = recordMeasurement(
      {},
      MutationSide.Backend,
      backendMeasurement,
    );
    expect(parseMutationRecord(renderMutationRecord(record))).toEqual(record);
  });

  it("ends in a single newline", () => {
    expect(renderMutationRecord({}).endsWith("}\n")).toBe(true);
  });
});

describe("parseMutationRecord", () => {
  it("refuses a record whose measurement is missing the commit it measured", () => {
    expect(() =>
      parseMutationRecord(
        JSON.stringify({
          backend: { ...backendMeasurement, commit: undefined },
        }),
      ),
    ).toThrow();
  });
});
