import { Phase } from "../phases";
import {
  FacilitatorIntent,
  FormationSubState,
  facilitatorWorkshopStateSchema,
} from "../workshopState";

describe("facilitator workshop state schema", () => {
  it("accepts a roster with participant identifiers and formed groups", () => {
    const state = facilitatorWorkshopStateSchema.parse({
      revision: 30,
      phase: 6,
      roster: {
        participants: [
          {
            participantId: "3f1a0f2e-0000-4000-8000-000000000001",
            displayName: "Anna Schmidt",
          },
        ],
        participantCount: 1,
      },
      enabledIntents: [],
      groups: [
        {
          name: { animalId: "otter", text: { de: "Otter", en: "Otter" } },
          members: [
            {
              participantId: "3f1a0f2e-0000-4000-8000-000000000001",
              displayName: "Anna Schmidt",
            },
          ],
          assignedValues: [
            { valueId: "mut", text: { de: "Mut", en: "Courage" } },
          ],
        },
      ],
    });

    if (state.phase !== Phase.GroupWork) {
      throw new Error("expected a group work state");
    }
    expect(state.groups[0].members[0].displayName).toBe("Anna Schmidt");
    expect(state.roster.participants[0].displayName).toBe("Anna Schmidt");
    expect(state.roster.participantCount).toBe(1);
  });

  it("accepts a formation state that carries both the selection progress and the groups", () => {
    const state = facilitatorWorkshopStateSchema.parse({
      revision: 30,
      phase: 5,
      roster: { participants: [], participantCount: 0 },
      enabledIntents: ["AdvancePhase"],
      selection: { values: [], submittedCount: 0 },
      formation: {
        subState: "formed",
        groups: [
          {
            name: { animalId: "otter", text: { de: "Otter", en: "Otter" } },
            members: [],
            assignedValues: [],
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
    expect(state.formation.groups[0].name.animalId).toBe("otter");
    expect(state.selection.submittedCount).toBe(0);
  });

  it("accepts a running formation that carries no groups at all", () => {
    const state = facilitatorWorkshopStateSchema.parse({
      revision: 30,
      phase: 5,
      roster: { participants: [], participantCount: 0 },
      enabledIntents: [],
      selection: { values: [], submittedCount: 0 },
      formation: { subState: "forming", progress: 0 },
    });

    if (
      state.phase !== Phase.GroupFormation ||
      state.formation.subState !== FormationSubState.Forming
    ) {
      throw new Error("expected a running group formation state");
    }
    expect(state.formation.progress).toBe(0);
  });

  it("accepts a value selection progress block with the catalog", () => {
    const state = facilitatorWorkshopStateSchema.parse({
      revision: 5,
      phase: 3,
      roster: { participants: [], participantCount: 0 },
      enabledIntents: ["AdvancePhase"],
      selection: {
        values: [{ valueId: "mut", text: { de: "Mut", en: "Courage" } }],
        submittedCount: 2,
      },
    });

    if (state.phase !== Phase.ValueSelection) {
      throw new Error("expected a value selection state");
    }
    expect(state.selection.submittedCount).toBe(2);
    expect(state.selection.values).toHaveLength(1);
    expect(state.selection.selectionTallies).toBeUndefined();
  });

  it("rejects a state without a roster", () => {
    const result = facilitatorWorkshopStateSchema.safeParse({
      revision: 1,
      phase: 1,
      enabledIntents: ["AdvancePhase"],
    });

    expect(result.success).toBe(false);
  });

  it("narrows the enabled intents into the facilitator intent enum", () => {
    const state = facilitatorWorkshopStateSchema.parse({
      revision: 3,
      phase: 2,
      roster: { participants: [], participantCount: 0 },
      enabledIntents: ["RevealAnswer"],
      quiz: {
        questionIndex: 0,
        questionCount: 5,
        subState: 1,
        question: { de: "Frage", en: "Question" },
        answers: [{ de: "Richtig", en: "Right" }],
        answerTallies: [0, 0, 0],
        answeredCount: 0,
        correctAnswerIndex: 1,
        learningText: { de: "Lerntext", en: "Learning text" },
      },
    });

    expect(state.enabledIntents).toEqual([FacilitatorIntent.RevealAnswer]);
  });

  it("accepts the reassign-scribe intent the backend enables from group work on", () => {
    const state = facilitatorWorkshopStateSchema.parse({
      revision: 6,
      phase: 6,
      roster: { participants: [], participantCount: 0 },
      enabledIntents: ["AdvancePhase", "ReassignScribe"],
      groups: [],
    });

    expect(state.enabledIntents).toContain(FacilitatorIntent.ReassignScribe);
  });

  it("rejects an intent name that is no facilitator hub method", () => {
    const result = facilitatorWorkshopStateSchema.safeParse({
      revision: 1,
      phase: 1,
      roster: { participants: [], participantCount: 0 },
      enabledIntents: ["DeleteSession"],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a state without the enabled intents", () => {
    const result = facilitatorWorkshopStateSchema.safeParse({
      revision: 1,
      phase: 1,
      roster: { participants: [], participantCount: 0 },
    });

    expect(result.success).toBe(false);
  });

  it("accepts a value-presentation state whose actions carry ids for wording fixes", () => {
    const state = facilitatorWorkshopStateSchema.parse({
      revision: 7,
      phase: 7,
      roster: { participants: [], participantCount: 0 },
      enabledIntents: ["GoToNextValue", "CorrectActionWording"],
      groups: [],
      presentation: {
        presentingGroupName: "otter",
        presentedValueId: "wert-1",
        presentedActions: [
          { actionId: "0f42e0a2-0000-4000-8000-000000000001", text: "We ask" },
        ],
      },
    });

    if (state.phase !== Phase.ValuePresentation) {
      throw new Error("expected a value-presentation state");
    }
    expect(state.enabledIntents).toContain(FacilitatorIntent.GoToNextValue);
    expect(state.presentation.presentedActions[0].actionId).toBe(
      "0f42e0a2-0000-4000-8000-000000000001",
    );
  });

  it("rejects a presented action without an id", () => {
    const result = facilitatorWorkshopStateSchema.safeParse({
      revision: 7,
      phase: 7,
      roster: { participants: [], participantCount: 0 },
      enabledIntents: [],
      groups: [],
      presentation: {
        presentingGroupName: "otter",
        presentedValueId: "wert-1",
        presentedActions: [{ text: "We ask" }],
      },
    });

    expect(result.success).toBe(false);
  });
});
