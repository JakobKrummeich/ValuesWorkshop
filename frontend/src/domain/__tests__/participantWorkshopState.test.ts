import { Phase } from "../phases";
import {
  FormationSubState,
  QuizSubState,
  participantWorkshopStateSchema,
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
      formation: {
        subState: "formed",
        ownGroup: {
          name: { animalId: "otter", text: { de: "Otter", en: "Otter" } },
          memberDisplayNames: ["Anna Schmidt", "Ben"],
          assignedValues: [
            { valueId: "mut", text: { de: "Mut", en: "Courage" } },
          ],
        },
      },
    });

    if (
      state.phase !== Phase.GroupFormation ||
      state.formation.subState !== FormationSubState.Formed
    ) {
      throw new Error("expected a formed group formation state");
    }
    expect(state.formation.ownGroup?.name.text.en).toBe("Otter");
    expect(state.formation.ownGroup?.memberDisplayNames).toEqual([
      "Anna Schmidt",
      "Ben",
    ]);
    expect(state.formation.ownGroup?.assignedValues[0].text.de).toBe("Mut");
  });

  it("rejects an own group whose name is a bare string", () => {
    const result = participantWorkshopStateSchema.safeParse({
      revision: 12,
      phase: 5,
      participantCount: 8,
      formation: {
        subState: "formed",
        ownGroup: {
          name: "otter",
          memberDisplayNames: [],
          assignedValues: [],
        },
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects formed groups that carry no own group", () => {
    const result = participantWorkshopStateSchema.safeParse({
      revision: 12,
      phase: 5,
      participantCount: 8,
      formation: { subState: "formed", ownGroup: null },
    });

    expect(result.success).toBe(false);
  });

  it("accepts a running formation that carries its progress", () => {
    const state = participantWorkshopStateSchema.parse({
      revision: 12,
      phase: 5,
      participantCount: 8,
      formation: { subState: "forming", progress: 0.35 },
    });

    if (
      state.phase !== Phase.GroupFormation ||
      state.formation.subState !== FormationSubState.Forming
    ) {
      throw new Error("expected a running group formation state");
    }
    expect(state.formation.progress).toBe(0.35);
  });

  it("keeps group data out of a running formation", () => {
    const state = participantWorkshopStateSchema.parse({
      revision: 12,
      phase: 5,
      participantCount: 8,
      formation: {
        subState: "forming",
        progress: 0.35,
        ownGroup: {
          name: { animalId: "otter", text: { de: "Otter", en: "Otter" } },
          memberDisplayNames: ["Anna Schmidt"],
          assignedValues: [],
        },
      },
    });

    if (state.phase !== Phase.GroupFormation) {
      throw new Error("expected a group formation state");
    }
    expect(state.formation).toEqual({
      subState: FormationSubState.Forming,
      progress: 0.35,
    });
  });

  it("rejects a formation progress outside the unit interval", () => {
    const result = participantWorkshopStateSchema.safeParse({
      revision: 12,
      phase: 5,
      participantCount: 8,
      formation: { subState: "forming", progress: 1.5 },
    });

    expect(result.success).toBe(false);
  });

  it("rejects a formation whose sub-state is not one of the two", () => {
    const result = participantWorkshopStateSchema.safeParse({
      revision: 12,
      phase: 5,
      participantCount: 8,
      formation: { subState: "solving", progress: 0.35 },
    });

    expect(result.success).toBe(false);
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

  it("accepts a final-voting state with the caller's round view", () => {
    const state = participantWorkshopStateSchema.parse({
      revision: 12,
      phase: 8,
      participantCount: 9,
      voting: {
        roundNumber: 1,
        allotment: 5,
        eligibleValueIds: ["wert-1", "wert-2"],
        isRoundOpen: true,
        hasVotedThisRound: false,
      },
    });

    if (state.phase !== Phase.FinalVoting) {
      throw new Error("expected a final voting state");
    }
    expect(state.voting.allotment).toBe(5);
    expect(state.voting.hasVotedThisRound).toBe(false);
  });

  it("rejects a final-voting state without the vote allotment", () => {
    const result = participantWorkshopStateSchema.safeParse({
      revision: 12,
      phase: 8,
      participantCount: 9,
      voting: {
        roundNumber: 1,
        eligibleValueIds: ["wert-1"],
        isRoundOpen: true,
        hasVotedThisRound: false,
      },
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
