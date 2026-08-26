import { Phase } from "../phases";
import {
  FormationSubState,
  presenterWorkshopStateSchema,
} from "../workshopState";

describe("presenter workshop state schema", () => {
  it("accepts a join state that lists everyone who joined by name", () => {
    const state = presenterWorkshopStateSchema.parse({
      revision: 2,
      phase: 1,
      participantCount: 1,
      participantDisplayNames: ["#a1b2c3"],
    });

    if (state.phase !== Phase.Join) {
      throw new Error("expected a join state");
    }
    expect(state.participantDisplayNames).toEqual(["#a1b2c3"]);
  });

  it("drops a roster of names sent for a phase past the lobby", () => {
    const state = presenterWorkshopStateSchema.parse({
      revision: 3,
      phase: 2,
      participantCount: 1,
      quiz: {
        questionIndex: 0,
        questionCount: 5,
        subState: 1,
        question: { de: "Frage", en: "Question" },
        answers: [{ de: "Richtig", en: "Right" }],
        answerTallies: [1, 0, 0],
      },
      participantDisplayNames: ["Anna Schmidt"],
    });

    expect("participantDisplayNames" in state).toBe(false);
  });

  it("accepts a selection progress block without tallies or top values", () => {
    const state = presenterWorkshopStateSchema.parse({
      revision: 5,
      phase: 3,
      participantCount: 4,
      selection: {
        values: [{ valueId: "mut", text: { de: "Mut", en: "Courage" } }],
        submittedCount: 1,
      },
    });

    if (state.phase !== Phase.ValueSelection) {
      throw new Error("expected a value selection state");
    }
    expect(state.selection.submittedCount).toBe(1);
    expect(state.selection.selectionTallies).toBeUndefined();
    expect(state.selection.topValueIds).toBeUndefined();
  });

  it("accepts an anonymous voting state", () => {
    const state = presenterWorkshopStateSchema.parse({
      revision: 44,
      phase: 8,
      participantCount: 8,
      voting: { isRoundOpen: true },
    });

    if (state.phase !== Phase.FinalVoting) {
      throw new Error("expected a final voting state");
    }
    expect(state.voting.isRoundOpen).toBe(true);
  });

  it("accepts groups that name members without identifying them", () => {
    const state = presenterWorkshopStateSchema.parse({
      revision: 44,
      phase: 5,
      participantCount: 8,
      selection: { values: [], submittedCount: 0 },
      formation: {
        subState: "formed",
        groups: [
          {
            name: { animalId: "otter", text: { de: "Otter", en: "Otter" } },
            memberDisplayNames: ["Anna Schmidt"],
            assignedValues: [
              { valueId: "mut", text: { de: "Mut", en: "Courage" } },
            ],
          },
        ],
      },
    });

    if (
      state.phase !== Phase.GroupFormation ||
      state.formation.subState !== FormationSubState.Formed
    ) {
      throw new Error("expected a formed group formation state");
    }
    expect(state.formation.groups[0].memberDisplayNames).toEqual([
      "Anna Schmidt",
    ]);
  });

  it("accepts a running formation on the wall with no groups at all", () => {
    const state = presenterWorkshopStateSchema.parse({
      revision: 44,
      phase: 5,
      participantCount: 8,
      selection: { values: [], submittedCount: 0 },
      formation: { subState: "forming", progress: 0.75 },
    });

    if (
      state.phase !== Phase.GroupFormation ||
      state.formation.subState !== FormationSubState.Forming
    ) {
      throw new Error("expected a running group formation state");
    }
    expect(state.formation.progress).toBe(0.75);
  });

  it("rejects a group that omits the member display names", () => {
    const result = presenterWorkshopStateSchema.safeParse({
      revision: 44,
      phase: 6,
      participantCount: 8,
      groups: [
        {
          name: { animalId: "otter", text: { de: "Otter", en: "Otter" } },
          members: [
            {
              participantId: "3f1a0f2e-0000-4000-8000-000000000001",
              displayName: "Anna Schmidt",
            },
          ],
          assignedValues: [],
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a negative revision", () => {
    const result = presenterWorkshopStateSchema.safeParse({
      revision: -1,
      phase: 1,
      participantCount: 0,
      roster: { participants: [], participantCount: 0 },
    });

    expect(result.success).toBe(false);
  });

  it("accepts a value-presentation state that names the presenting group and its actions", () => {
    const state = presenterWorkshopStateSchema.parse({
      revision: 9,
      phase: 7,
      participantCount: 3,
      groups: [],
      presentation: {
        presentingGroupName: "otter",
        presentedValueId: "wert-1",
        presentedActions: [{ text: "We start meetings on time" }],
      },
    });

    if (state.phase !== Phase.ValuePresentation) {
      throw new Error("expected a value-presentation state");
    }
    expect(state.presentation.presentingGroupName).toBe("otter");
    expect(state.presentation.presentedActions).toEqual([
      { text: "We start meetings on time" },
    ]);
  });

  it("accepts a group intro that presents no value and no actions", () => {
    const state = presenterWorkshopStateSchema.parse({
      revision: 9,
      phase: 7,
      participantCount: 3,
      groups: [],
      presentation: {
        presentingGroupName: "otter",
        presentedValueId: null,
        presentedActions: [],
      },
    });

    if (state.phase !== Phase.ValuePresentation) {
      throw new Error("expected a value-presentation state");
    }
    expect(state.presentation.presentedValueId).toBeNull();
    expect(state.presentation.presentedActions).toEqual([]);
  });
});
