import type { GroupActionView } from "../../../../../domain/workshopState";
import {
  actionsForValue,
  everyValueHasNonEmptyAction,
  resolveActionText,
  valueSubmissions,
} from "../actionDrafts";

const actions: GroupActionView[] = [
  { actionId: "a2", valueId: "trust", text: "Listen", sortOrder: 1 },
  { actionId: "a1", valueId: "trust", text: "Talk", sortOrder: 0 },
  { actionId: "a3", valueId: "courage", text: "Dare", sortOrder: 0 },
];

const values = [
  { valueId: "trust", text: { de: "Vertrauen", en: "Trust" } },
  { valueId: "courage", text: { de: "Mut", en: "Courage" } },
];

describe("actionsForValue", () => {
  it("returns the value's actions sorted by sort order", () => {
    const result = actionsForValue(actions, "trust");
    expect(result.map((action) => action.actionId)).toEqual(["a1", "a2"]);
  });

  it("returns no actions when no value is selected", () => {
    expect(actionsForValue(actions, null)).toEqual([]);
  });
});

describe("resolveActionText", () => {
  it("prefers the local draft over the server text", () => {
    expect(resolveActionText(actions[0], { a2: "Listen well" })).toBe(
      "Listen well",
    );
  });

  it("keeps an empty local draft instead of falling back", () => {
    expect(resolveActionText(actions[0], { a2: "" })).toBe("");
  });

  it("falls back to the server text without a draft", () => {
    expect(resolveActionText(actions[0], {})).toBe("Listen");
  });
});

describe("everyValueHasNonEmptyAction", () => {
  it("accepts when each value has an action with text", () => {
    expect(everyValueHasNonEmptyAction(values, actions, {})).toBe(true);
  });

  it("rejects when a value has no actions", () => {
    const trustOnly = actions.filter((action) => action.valueId === "trust");
    expect(everyValueHasNonEmptyAction(values, trustOnly, {})).toBe(false);
  });

  it("rejects when a value's only text is whitespace", () => {
    expect(everyValueHasNonEmptyAction(values, actions, { a3: "   " })).toBe(
      false,
    );
  });

  it("accepts when a draft fills an empty server text", () => {
    const withEmptyServerText = actions.map((action) =>
      action.actionId === "a3" ? { ...action, text: "" } : action,
    );
    expect(
      everyValueHasNonEmptyAction(values, withEmptyServerText, {
        a3: "Dare more",
      }),
    ).toBe(true);
  });
});

describe("valueSubmissions", () => {
  it("groups drafted action texts per assigned value in sort order", () => {
    expect(valueSubmissions(values, actions, { a1: "Talk openly" })).toEqual([
      {
        valueId: "trust",
        actions: [
          { actionId: "a1", text: "Talk openly" },
          { actionId: "a2", text: "Listen" },
        ],
      },
      { valueId: "courage", actions: [{ actionId: "a3", text: "Dare" }] },
    ]);
  });
});
