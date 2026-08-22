import { Phase } from "../phases";
import {
  FacilitatorIntent,
  QuizSubState,
  facilitatorWorkshopStateSchema,
  participantWorkshopStateSchema,
  presenterWorkshopStateSchema,
} from "../workshopState";

describe("participant workshop state schema", () => {
  it("accepts a join state that carries the caller's own display name", () => {
    const state = participantWorkshopStateSchema.parse({
      revision: 0,
      phase: 1,
      participantCount: 3,
      ownDisplayName: "Anna Schmidt",
    });

    if (state.phase !== Phase.Join) {
      throw new Error("expected a join state");
    }
    expect(state.ownDisplayName).toBe("Anna Schmidt");
  });

  it("rejects a join state without the caller's own display name", () => {
    const result = participantWorkshopStateSchema.safeParse({
      revision: 0,
      phase: 1,
      participantCount: 3,
    });

    expect(result.success).toBe(false);
  });

  it("accepts a value selection state with the catalog and the caller's own picks", () => {
    const state = participantWorkshopStateSchema.parse({
      revision: 5,
      phase: 3,
      participantCount: 3,
      selection: {
        values: [{ valueId: "mut", text: { de: "Mut", en: "Courage" } }],
        ownSelectedValueIds: ["mut"],
        isSubmitted: false,
      },
    });

    if (state.phase !== Phase.ValueSelection) {
      throw new Error("expected a value selection state");
    }
    expect(state.selection.values[0].text.de).toBe("Mut");
    expect(state.selection.isSubmitted).toBe(false);
    expect(state.selection.selectionTallies).toBeUndefined();
    expect(state.selection.topValueIds).toBeUndefined();
  });

  it("accepts a selection block that carries tallies and top values once they exist", () => {
    const state = participantWorkshopStateSchema.parse({
      revision: 9,
      phase: 4,
      participantCount: 3,
      selection: {
        values: [{ valueId: "mut", text: { de: "Mut", en: "Courage" } }],
        ownSelectedValueIds: ["mut"],
        isSubmitted: true,
        selectionTallies: { mut: 7 },
        topValueIds: ["mut"],
      },
    });

    if (state.phase !== Phase.SelectionResults) {
      throw new Error("expected a selection results state");
    }
    expect(state.selection.selectionTallies).toEqual({ mut: 7 });
    expect(state.selection.topValueIds).toEqual(["mut"]);
  });

  it("rejects a selection block without the submission flag", () => {
    const result = participantWorkshopStateSchema.safeParse({
      revision: 5,
      phase: 3,
      participantCount: 3,
      selection: {
        values: [],
        ownSelectedValueIds: [],
        isOwnSubmitted: false,
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects a selection block without the values catalog", () => {
    const result = participantWorkshopStateSchema.safeParse({
      revision: 5,
      phase: 3,
      participantCount: 3,
      selection: {
        ownSelectedValueIds: [],
        isSubmitted: false,
      },
    });

    expect(result.success).toBe(false);
  });

  it("accepts the caller's own group card with localized texts", () => {
    const state = participantWorkshopStateSchema.parse({
      revision: 12,
      phase: 5,
      participantCount: 8,
      ownGroup: {
        name: { animalId: "otter", text: { de: "Otter", en: "Otter" } },
        memberDisplayNames: ["Anna Schmidt", "Ben"],
        assignedValues: [
          { valueId: "mut", text: { de: "Mut", en: "Courage" } },
        ],
      },
    });

    if (state.phase !== Phase.GroupFormation) {
      throw new Error("expected a group formation state");
    }
    expect(state.ownGroup?.name.text.en).toBe("Otter");
    expect(state.ownGroup?.memberDisplayNames).toEqual(["Anna Schmidt", "Ben"]);
    expect(state.ownGroup?.assignedValues[0].text.de).toBe("Mut");
  });

  it("rejects an own group whose name is a bare string", () => {
    const result = participantWorkshopStateSchema.safeParse({
      revision: 12,
      phase: 5,
      participantCount: 8,
      ownGroup: {
        name: "otter",
        memberDisplayNames: [],
        assignedValues: [],
      },
    });

    expect(result.success).toBe(false);
  });

  it("accepts a group formation state for a caller who is in no group", () => {
    const state = participantWorkshopStateSchema.parse({
      revision: 12,
      phase: 5,
      participantCount: 8,
      ownGroup: null,
    });

    expect(state.phase).toBe(Phase.GroupFormation);
  });

  it("rejects a state whose phase is outside the nine phases", () => {
    const result = participantWorkshopStateSchema.safeParse({
      revision: 1,
      phase: 10,
      participantCount: 1,
      ownDisplayName: "Anna Schmidt",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a state that is missing the block its phase requires", () => {
    const result = participantWorkshopStateSchema.safeParse({
      revision: 1,
      phase: 8,
      participantCount: 1,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a block sent as undefined rather than as its value", () => {
    const result = participantWorkshopStateSchema.safeParse({
      revision: 1,
      phase: 2,
      participantCount: 1,
      quiz: undefined,
    });

    expect(result.success).toBe(false);
  });

  it("accepts a posed quiz question with bilingual content and no revealed answer", () => {
    const state = participantWorkshopStateSchema.parse({
      revision: 3,
      phase: 2,
      participantCount: 1,
      quiz: {
        questionIndex: 0,
        questionCount: 5,
        subState: 1,
        question: { de: "Frage", en: "Question" },
        answers: [
          { de: "Falsch", en: "Wrong" },
          { de: "Richtig", en: "Right" },
          { de: "Witzig", en: "Funny" },
        ],
        ownAnswerIndex: null,
      },
    });

    if (state.phase !== Phase.Quiz) {
      throw new Error("expected a quiz state");
    }
    expect(state.quiz.subState).toBe(QuizSubState.Answering);
    expect(state.quiz.questionCount).toBe(5);
  });

  it("accepts a revealed quiz question and carries no reveal data", () => {
    const state = participantWorkshopStateSchema.parse({
      revision: 4,
      phase: 2,
      participantCount: 1,
      quiz: {
        questionIndex: 2,
        questionCount: 3,
        subState: 2,
        question: { de: "Frage", en: "Question" },
        answers: [{ de: "Richtig", en: "Right" }],
        ownAnswerIndex: 0,
      },
    });

    if (state.phase !== Phase.Quiz) {
      throw new Error("expected a quiz state");
    }
    expect(state.quiz.subState).toBe(QuizSubState.Revealed);
    expect(state.quiz.ownAnswerIndex).toBe(0);
    expect("correctAnswerIndex" in state.quiz).toBe(false);
    expect("learningText" in state.quiz).toBe(false);
  });

  it("rejects an own answer index that points past the answers", () => {
    const result = participantWorkshopStateSchema.safeParse({
      revision: 4,
      phase: 2,
      participantCount: 1,
      quiz: {
        questionIndex: 0,
        questionCount: 5,
        subState: 2,
        question: { de: "Frage", en: "Question" },
        answers: [
          { de: "Falsch", en: "Wrong" },
          { de: "Richtig", en: "Right" },
        ],
        ownAnswerIndex: 2,
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects a negative own answer index", () => {
    const result = participantWorkshopStateSchema.safeParse({
      revision: 4,
      phase: 2,
      participantCount: 1,
      quiz: {
        questionIndex: 0,
        questionCount: 5,
        subState: 2,
        question: { de: "Frage", en: "Question" },
        answers: [{ de: "Richtig", en: "Right" }],
        ownAnswerIndex: -1,
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects a quiz state without a posed question", () => {
    const result = participantWorkshopStateSchema.safeParse({
      revision: 3,
      phase: 2,
      participantCount: 1,
      quiz: { questionIndex: null, subState: 1 },
    });

    expect(result.success).toBe(false);
  });

  it("rejects a quiz state without the total question count", () => {
    const result = participantWorkshopStateSchema.safeParse({
      revision: 3,
      phase: 2,
      participantCount: 1,
      quiz: {
        questionIndex: 0,
        subState: 1,
        question: { de: "Frage", en: "Question" },
        answers: [{ de: "Richtig", en: "Right" }],
        ownAnswerIndex: null,
      },
    });

    expect(result.success).toBe(false);
  });
});

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
      groups: [
        {
          name: { animalId: "otter", text: { de: "Otter", en: "Otter" } },
          members: [],
          assignedValues: [],
        },
      ],
    });

    if (state.phase !== Phase.GroupFormation) {
      throw new Error("expected a group formation state");
    }
    expect(state.groups[0].name.animalId).toBe("otter");
    expect(state.selection.submittedCount).toBe(0);
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
});

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
      groups: [
        {
          name: { animalId: "otter", text: { de: "Otter", en: "Otter" } },
          memberDisplayNames: ["Anna Schmidt"],
          assignedValues: [
            { valueId: "mut", text: { de: "Mut", en: "Courage" } },
          ],
        },
      ],
    });

    if (state.phase !== Phase.GroupFormation) {
      throw new Error("expected a group formation state");
    }
    expect(state.groups[0].memberDisplayNames).toEqual(["Anna Schmidt"]);
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
});
