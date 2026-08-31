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
        Guid.Parse("00000000-0000-0000-0000-0000000000c3")
    );
    private static readonly ParticipantId Dana = new(
        Guid.Parse("00000000-0000-0000-0000-0000000000d4")
    );

    private static readonly SessionIdentity Identity = new(
        Guid.Parse("00000000-0000-0000-0000-00000000f00d")
    );

    private static readonly ValueId FirstValue = new("wert-1");
    private static readonly ValueId SecondValue = new("wert-2");

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
                    new SelectedValue(Chris, Wert(9)),
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
        var voting = TestVoting.MainRoundOpen([FirstValue, SecondValue]);
        voting.RecordBallot(
            Ben,
            new Dictionary<ValueId, int> { [FirstValue] = 3, [SecondValue] = 2 }
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
                    ClosedRound(
                        locked: [FirstValue, SecondValue, Wert(3), Wert(4)],
                        tied: [Wert(5), Wert(6)]
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
                    ClosedRound(
                        locked: [FirstValue, SecondValue, Wert(3), Wert(4), Wert(5)],
                        tied: []
                    ),
                ],
                null
            )
        );
    }

    private static ClosedVotingRound ClosedRound(
        IReadOnlyList<ValueId> locked,
        IReadOnlyList<ValueId> tied
    )
    {
        IReadOnlyList<ValueId> eligible = [.. locked, .. tied];
        var tallies = eligible.ToDictionary(
            value => value,
            value => locked.Contains(value) ? 10 - locked.ToList().IndexOf(value) : 3
        );

        return new ClosedVotingRound(
            1,
            VotingRounds.RequiredWinningValueCount,
            eligible,
            tallies,
            VotedCount: 8,
            locked,
            tied
        );
    }

    private static ValueId Wert(int number)
    {
        return new ValueId($"wert-{number}");
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
                    [FirstValue],
                    Anna,
                    false,
                    [
                        new GroupAction(
                            new ActionId(Guid.Parse("00000000-0000-0000-0000-00000000ac01")),
                            FirstValue,
                            GroupActionText.Of("We name mistakes the day we make them")
                        ),
                    ]
                ),
                Group.Restore(
                    "tier-2",
                    [Chris],
                    [SecondValue],
                    Chris,
                    true,
                    [
                        new GroupAction(
                            new ActionId(Guid.Parse("00000000-0000-0000-0000-00000000ac02")),
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
