using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Tests;

// WHY: the corpus is only worth what its samples cover, so these sessions are
// deliberately populated — named and unnamed participants, a submitted and an
// unsubmitted group, a participant outside every group, an open and a closed
// voting round — and deliberately fixed: literal Guids and no clock or
// randomness, so a serialized sample changes only when the contract does.
// Plan: docs/architecture/reviews/2026-08-30-wire-contract-fitness-function.md (step 5).
internal static class WireStateFixtures
{
    private static readonly ParticipantId Anna = new(
        Guid.Parse("00000000-0000-0000-0000-0000000000a1")
    );
    private static readonly ParticipantId Ben = new(
        Guid.Parse("00000000-0000-0000-0000-0000000000b2")
    );
    private static readonly ParticipantId Chris = new(
        Guid.Parse("c3c3c3c3-0000-0000-0000-0000000000c3")
    );
    private static readonly ParticipantId Dana = new(
        Guid.Parse("00000000-0000-0000-0000-0000000000d4")
    );

    private static readonly SessionIdentity Identity = new(
        Guid.Parse("00000000-0000-0000-0000-00000000f00d")
    );

    private static readonly ValueId FirstValue = ValueNumbered(1);
    private static readonly ValueId SecondValue = ValueNumbered(2);

    // WHY: the voting rounds may only run over values the groups actually
    // presented, so the eligible sets below stay the union of the two groups'
    // assigned values.
    private static readonly IReadOnlyList<ValueId> PresentedValues =
    [
        FirstValue,
        ValueNumbered(3),
        ValueNumbered(5),
        SecondValue,
        ValueNumbered(4),
        ValueNumbered(6),
    ];

    internal static IReadOnlyList<WireStateScenario> All =>
        [
            new("join", InPhase(Phase.Join), Anna),
            new("quiz", Quizzing(), Anna),
            new("valueSelection", Selecting(), Anna),
            new("selectionResults", SelectionFinished(), Anna),
            new("groupFormationForming", InPhase(Phase.GroupFormation), Anna),
            new("groupFormation", InPhase(Phase.GroupFormation, formation: TwoGroups()), Anna),
            new("groupWork", Working(), Anna),
            new("groupWorkWithoutOwnGroup", Working(), Dana, [WireRoles.Participant]),
            new("groupWorkSubmitted", Working(), Chris, [WireRoles.Participant]),
            new("valuePresentation", Presenting(), Anna),
            new("finalVoting", VotingRoundOpen(), Anna),
            new("finalVotingClosed", VotingRoundClosed(), Anna),
            new("finalPresentation", WinnersStanding(), Anna),
        ];

    private static Session Quizzing()
    {
        return InPhase(
            Phase.Quiz,
            quiz: QuizProgress.Restore(
                1,
                true,
                false,
                [
                    new CastAnswer(0, Anna, TestQuizCatalog.CorrectAnswerIndex),
                    new CastAnswer(0, Ben, 2),
                    new CastAnswer(1, Anna, 0),
                ]
            )
        );
    }

    private static Session Selecting()
    {
        return InPhase(
            Phase.ValueSelection,
            selection: SelectionRound.Restore(
                [new SelectedValue(Anna, FirstValue), new SelectedValue(Anna, SecondValue)],
                []
            )
        );
    }

    private static Session SelectionFinished()
    {
        return InPhase(
            Phase.SelectionResults,
            selection: SelectionRound.Restore(
                [
                    new SelectedValue(Anna, FirstValue),
                    new SelectedValue(Ben, FirstValue),
                    new SelectedValue(Chris, FirstValue),
                    new SelectedValue(Anna, SecondValue),
                    new SelectedValue(Ben, SecondValue),
                    new SelectedValue(Chris, ValueNumbered(9)),
                ],
                [FirstValue, SecondValue]
            )
        );
    }

    private static Session Working()
    {
        return InPhase(Phase.GroupWork, formation: TwoGroups());
    }

    private static Session Presenting()
    {
        return InPhase(
            Phase.ValuePresentation,
            formation: TwoGroups(),
            presentation: PresentationWalk.Restore("tier-1", FirstValue, 1)
        );
    }

    private static Session VotingRoundOpen()
    {
        var voting = TestVoting.MainRoundOpen(PresentedValues);
        voting.RecordBallot(
            Ben,
            new Dictionary<ValueId, int> { [FirstValue] = 3, [ValueNumbered(5)] = 2 }
        );

        return InPhase(Phase.FinalVoting, formation: TwoGroups(), voting: voting);
    }

    // WHY: a tie at the fifth place is the state the facilitator has to resolve
    // with a tiebreak round, and the only one where locked and tied values travel
    // side by side.
    private static Session VotingRoundClosed()
    {
        return InPhase(
            Phase.FinalVoting,
            formation: TwoGroups(),
            voting: VotingRounds.Restore(
                [
                    TestVoting.ClosedRound(
                        1,
                        lockedValues: [FirstValue, ValueNumbered(3), SecondValue, ValueNumbered(4)],
                        tiedValues: [ValueNumbered(5), ValueNumbered(6)]
                    ),
                ],
                null
            )
        );
    }

    private static Session WinnersStanding()
    {
        return InPhase(
            Phase.FinalPresentation,
            formation: TwoGroups(),
            voting: VotingRounds.Restore(
                [
                    TestVoting.ClosedRound(
                        1,
                        lockedValues:
                        [
                            FirstValue,
                            ValueNumbered(3),
                            ValueNumbered(5),
                            SecondValue,
                            ValueNumbered(4),
                        ],
                        tiedValues: []
                    ),
                ],
                null
            )
        );
    }

    private static ValueId ValueNumbered(int number)
    {
        return TestValueIds.Numbered(number, 1)[0];
    }

    // WHY: tier-1 keeps working while tier-2 has submitted, so a single sample
    // carries both GroupWorkStatus values across the wire.
    private static FormationRecord TwoGroups()
    {
        return FormationRecord.Restore(
            true,
            [
                Group.Restore(
                    "tier-1",
                    [Anna, Ben],
                    [FirstValue, ValueNumbered(3), ValueNumbered(5)],
                    Anna,
                    false,
                    [
                        new GroupAction(
                            new ActionId(Guid.Parse("00000000-0000-0000-0000-00000000ac01")),
                            FirstValue,
                            GroupActionText.Of("We name mistakes the day we make them")
                        ),
                        new GroupAction(
                            new ActionId(Guid.Parse("00000000-0000-0000-0000-00000000ac02")),
                            ValueNumbered(3),
                            GroupActionText.Of("We decide in the room, not in the corridor")
                        ),
                    ]
                ),
                Group.Restore(
                    "tier-2",
                    [Chris],
                    [SecondValue, ValueNumbered(4), ValueNumbered(6)],
                    Chris,
                    true,
                    [
                        new GroupAction(
                            new ActionId(Guid.Parse("00000000-0000-0000-0000-00000000ac03")),
                            SecondValue,
                            GroupActionText.Of("We ask before we assume")
                        ),
                    ]
                ),
            ]
        );
    }

    private static Session InPhase(
        Phase phase,
        QuizProgress? quiz = null,
        SelectionRound? selection = null,
        FormationRecord? formation = null,
        PresentationWalk? presentation = null,
        VotingRounds? voting = null
    )
    {
        return TestSessions.InPhase(
            Identity,
            phase,
            quiz,
            selection,
            formation,
            presentation,
            voting,
            revision: 42,
            roster:
            [
                TestParticipants.Named(Anna, "Anna Schmidt"),
                TestParticipants.Named(Ben, "Ben"),
                TestParticipants.Unnamed(Chris),
                TestParticipants.Named(Dana, "Dana"),
            ]
        );
    }
}

internal sealed record WireStateScenario(
    string Name,
    Session Session,
    ParticipantId Caller,
    IReadOnlyList<string>? Roles = null
)
{
    internal IReadOnlyList<string> RolesCovered => Roles ?? WireRoles.All;
}

internal static class WireRoles
{
    internal const string Participant = "participant";
    internal const string Facilitator = "facilitator";
    internal const string Presenter = "presenter";

    internal static readonly IReadOnlyList<string> All = [Participant, Facilitator, Presenter];
}
