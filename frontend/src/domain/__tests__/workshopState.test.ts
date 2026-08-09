import { Phase } from "../phases";
import {
  GroupWorkStatus,
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

  it("accepts the caller-shaped block of a group work state", () => {
    const state = participantWorkshopStateSchema.parse({
      revision: 12,
      phase: 6,
      participantCount: 8,
      ownGroup: {
        name: "otter",
        memberCount: 4,
        assignedValueIds: ["courage", "trust"],
        isCallerScribe: true,
        workStatus: 2,
      },
    });

    if (state.phase !== Phase.GroupWork) {
      throw new Error("expected a group work state");
    }
    expect(state.ownGroup?.workStatus).toBe(GroupWorkStatus.Submitted);
  });

  it("accepts a group work state for a caller who is in no group", () => {
    const state = participantWorkshopStateSchema.parse({
      revision: 12,
      phase: 6,
      participantCount: 8,
      ownGroup: null,
    });

    expect(state.phase).toBe(Phase.GroupWork);
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
    expect(state.quiz.correctAnswerIndex).toBeUndefined();
  });

  it("accepts a revealed quiz question that carries the correct answer", () => {
    const state = participantWorkshopStateSchema.parse({
      revision: 4,
      phase: 2,
      participantCount: 1,
      quiz: {
        questionIndex: 2,
        subState: 2,
        question: { de: "Frage", en: "Question" },
        answers: [{ de: "Richtig", en: "Right" }],
        ownAnswerIndex: 0,
        correctAnswerIndex: 0,
      },
    });

    if (state.phase !== Phase.Quiz) {
      throw new Error("expected a quiz state");
    }
    expect(state.quiz.correctAnswerIndex).toBe(0);
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
      groups: [
        {
          name: "otter",
          memberParticipantIds: ["3f1a0f2e-0000-4000-8000-000000000001"],
          assignedValueIds: ["courage"],
          scribeParticipantId: "3f1a0f2e-0000-4000-8000-000000000001",
          workStatus: 1,
        },
      ],
    });

    if (state.phase !== Phase.GroupWork) {
      throw new Error("expected a group work state");
    }
    expect(state.groups[0].workStatus).toBe(GroupWorkStatus.Editing);
    expect(state.roster.participants[0].displayName).toBe("Anna Schmidt");
    expect(state.roster.participantCount).toBe(1);
  });

  it("accepts a group without a scribe yet", () => {
    const state = facilitatorWorkshopStateSchema.parse({
      revision: 30,
      phase: 5,
      roster: { participants: [], participantCount: 0 },
      selection: { submittedCount: 0, topValueIds: [] },
      groups: [
        {
          name: "otter",
          memberParticipantIds: [],
          assignedValueIds: [],
          scribeParticipantId: null,
          workStatus: 1,
        },
      ],
    });

    if (state.phase !== Phase.GroupFormation) {
      throw new Error("expected a group formation state");
    }
    expect(state.groups[0].scribeParticipantId).toBeNull();
  });

  it("rejects a state without a roster", () => {
    const result = facilitatorWorkshopStateSchema.safeParse({
      revision: 1,
      phase: 1,
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
        subState: 1,
        question: { de: "Frage", en: "Question" },
        answers: [{ de: "Richtig", en: "Right" }],
        answerTallies: [1, 0, 0],
      },
      participantDisplayNames: ["Anna Schmidt"],
    });

    expect("participantDisplayNames" in state).toBe(false);
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

  it("rejects a group that reports members instead of an anonymous count", () => {
    const result = presenterWorkshopStateSchema.safeParse({
      revision: 44,
      phase: 6,
      participantCount: 8,
      groups: [
        {
          name: "otter",
          memberParticipantIds: ["3f1a0f2e-0000-4000-8000-000000000001"],
          assignedValueIds: [],
          workStatus: 1,
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
