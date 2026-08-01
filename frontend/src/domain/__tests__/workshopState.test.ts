import { Phase } from "../phases";
import {
  GroupWorkStatus,
  QuizSubState,
  facilitatorWorkshopStateSchema,
  participantWorkshopStateSchema,
  presenterWorkshopStateSchema,
} from "../workshopState";

describe("participant workshop state schema", () => {
  it("accepts a join state that carries nothing but the envelope", () => {
    const state = participantWorkshopStateSchema.parse({
      revision: 0,
      phase: 1,
      participantCount: 3,
    });

    expect(state.phase).toBe(Phase.Join);
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

  it("accepts a quiz state before the first question is posed", () => {
    const state = participantWorkshopStateSchema.parse({
      revision: 3,
      phase: 2,
      participantCount: 1,
      quiz: { questionNumber: null, subState: 1 },
    });

    if (state.phase !== Phase.Quiz) {
      throw new Error("expected a quiz state");
    }
    expect(state.quiz.subState).toBe(QuizSubState.Answering);
  });
});

describe("facilitator workshop state schema", () => {
  it("accepts a roster with participant identifiers and formed groups", () => {
    const state = facilitatorWorkshopStateSchema.parse({
      revision: 30,
      phase: 6,
      roster: {
        participantIds: ["3f1a0f2e-0000-4000-8000-000000000001"],
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
    expect(state.roster.participantCount).toBe(1);
  });

  it("accepts a group without a scribe yet", () => {
    const state = facilitatorWorkshopStateSchema.parse({
      revision: 30,
      phase: 5,
      roster: { participantIds: [], participantCount: 0 },
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
    });

    expect(result.success).toBe(false);
  });
});
