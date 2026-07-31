import { Phase } from "../phases";
import {
  GroupWorkStatus,
  QuizSubState,
  facilitatorWorkshopStateSchema,
  participantWorkshopStateSchema,
  presenterWorkshopStateSchema,
} from "../workshopState";

const emptyBlocks = {
  quiz: null,
  selection: null,
  presentation: null,
  voting: null,
  conclusion: null,
};

describe("participant workshop state schema", () => {
  it("accepts a fresh join state where every phase block is still absent", () => {
    const state = participantWorkshopStateSchema.parse({
      revision: 0,
      phase: 1,
      participantCount: 3,
      ownGroup: null,
      ...emptyBlocks,
    });

    expect(state.phase).toBe(Phase.Join);
    expect(state.quiz).toBeNull();
  });

  it("accepts the caller-shaped blocks of a group work state", () => {
    const state = participantWorkshopStateSchema.parse({
      revision: 12,
      phase: 6,
      participantCount: 8,
      quiz: { questionNumber: 4, subState: 3 },
      selection: { isOwnSubmitted: true, topValueIds: ["courage"] },
      ownGroup: {
        name: "otter",
        memberCount: 4,
        assignedValueIds: ["courage", "trust"],
        isCallerScribe: true,
        workStatus: 2,
      },
      presentation: null,
      voting: null,
      conclusion: null,
    });

    expect(state.quiz?.subState).toBe(QuizSubState.LearningTextShown);
    expect(state.ownGroup?.workStatus).toBe(GroupWorkStatus.Submitted);
  });

  it("rejects a state whose phase is outside the nine phases", () => {
    const result = participantWorkshopStateSchema.safeParse({
      revision: 1,
      phase: 10,
      participantCount: 1,
      ownGroup: null,
      ...emptyBlocks,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a state that is missing a required block", () => {
    const result = participantWorkshopStateSchema.safeParse({
      revision: 1,
      phase: 1,
      participantCount: 1,
      ownGroup: null,
      quiz: null,
      selection: null,
      presentation: null,
      voting: null,
    });

    expect(result.success).toBe(false);
  });

  it("rejects an absent block sent as undefined rather than null", () => {
    const result = participantWorkshopStateSchema.safeParse({
      revision: 1,
      phase: 1,
      participantCount: 1,
      ownGroup: null,
      ...emptyBlocks,
      quiz: undefined,
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
        participantIds: ["3f1a0f2e-0000-4000-8000-000000000001"],
        participantCount: 1,
      },
      quiz: null,
      selection: { submittedCount: 1, topValueIds: ["courage"] },
      groups: [
        {
          name: "otter",
          memberParticipantIds: ["3f1a0f2e-0000-4000-8000-000000000001"],
          assignedValueIds: ["courage"],
          scribeParticipantId: "3f1a0f2e-0000-4000-8000-000000000001",
          workStatus: 1,
        },
      ],
      presentation: null,
      voting: null,
      conclusion: null,
    });

    expect(state.groups?.[0].workStatus).toBe(GroupWorkStatus.Editing);
    expect(state.roster.participantCount).toBe(1);
  });

  it("accepts a group without a scribe yet", () => {
    const state = facilitatorWorkshopStateSchema.parse({
      revision: 30,
      phase: 5,
      roster: { participantIds: [], participantCount: 0 },
      groups: [
        {
          name: "otter",
          memberParticipantIds: [],
          assignedValueIds: [],
          scribeParticipantId: null,
          workStatus: 1,
        },
      ],
      ...emptyBlocks,
    });

    expect(state.groups?.[0].scribeParticipantId).toBeNull();
  });

  it("rejects a state without a roster", () => {
    const result = facilitatorWorkshopStateSchema.safeParse({
      revision: 1,
      phase: 1,
      groups: null,
      ...emptyBlocks,
    });

    expect(result.success).toBe(false);
  });
});

describe("presenter workshop state schema", () => {
  it("accepts anonymous group and voting blocks", () => {
    const state = presenterWorkshopStateSchema.parse({
      revision: 44,
      phase: 8,
      participantCount: 8,
      quiz: { questionNumber: 1, subState: 2 },
      selection: { submittedCount: 8, topValueIds: ["courage"] },
      groups: [
        {
          name: "otter",
          memberCount: 4,
          assignedValueIds: ["courage"],
          workStatus: 2,
        },
      ],
      presentation: { presentedValueId: "courage" },
      voting: { isRoundOpen: true },
      conclusion: { winningValueIds: [] },
    });

    expect(state.quiz?.subState).toBe(QuizSubState.Revealed);
    expect(state.voting?.isRoundOpen).toBe(true);
  });

  it("rejects a group that reports members instead of an anonymous count", () => {
    const result = presenterWorkshopStateSchema.safeParse({
      revision: 44,
      phase: 5,
      participantCount: 8,
      groups: [
        {
          name: "otter",
          memberParticipantIds: ["3f1a0f2e-0000-4000-8000-000000000001"],
          assignedValueIds: [],
          workStatus: 1,
        },
      ],
      ...emptyBlocks,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a negative revision", () => {
    const result = presenterWorkshopStateSchema.safeParse({
      revision: -1,
      phase: 1,
      participantCount: 0,
      groups: null,
      ...emptyBlocks,
    });

    expect(result.success).toBe(false);
  });
});
