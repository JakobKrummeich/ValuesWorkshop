using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Tests;

internal static class SessionFixtures
{
    internal static readonly ParticipantId Anna = new(
        Guid.Parse("00000000-0000-0000-0000-0000000000a1")
    );
    internal static readonly ParticipantId Ben = new(
        Guid.Parse("00000000-0000-0000-0000-0000000000b2")
    );
    internal static readonly ParticipantId Chris = new(
        Guid.Parse("c3c3c3c3-0000-0000-0000-0000000000c3")
    );

    internal static Session InPhase(
        Phase phase,
        QuizProgress? quiz = null,
        SelectionRound? selection = null,
        FormationRecord? formation = null,
        PresentationWalk? presentation = null,
        VotingRounds? voting = null,
        WinnerReveal? reveal = null,
        long revision = 0
    )
    {
        return TestSessions.InPhase(
            new SessionIdentity(Guid.Parse("00000000-0000-0000-0000-00000000f00d")),
            phase,
            quiz,
            selection,
            formation,
            presentation,
            voting,
            reveal,
            revision,
            roster:
            [
                TestParticipants.Named(Anna, "Anna Schmidt"),
                TestParticipants.Named(Ben, "Ben"),
                TestParticipants.Unnamed(Chris),
            ]
        );
    }

    internal static Session InSelectionResults()
    {
        return InPhase(
            Phase.SelectionResults,
            selection: SelectionRound.Restore(
                [
                    new SelectedValue(Anna, new ValueId("wert-5")),
                    new SelectedValue(Ben, new ValueId("wert-5")),
                    new SelectedValue(Chris, new ValueId("wert-5")),
                    new SelectedValue(Anna, new ValueId("wert-2")),
                    new SelectedValue(Ben, new ValueId("wert-2")),
                    new SelectedValue(Anna, new ValueId("wert-9")),
                    new SelectedValue(Chris, new ValueId("wert-9")),
                    new SelectedValue(Ben, new ValueId("wert-1")),
                ],
                [
                    new ValueId("wert-9"),
                    new ValueId("wert-1"),
                    new ValueId("wert-5"),
                    new ValueId("wert-2"),
                ]
            )
        );
    }

    internal static FormationRecord TwoGroups(params GroupAction[] tierOneActions)
    {
        return FormationRecord.Restore(
            true,
            [
                Group.Restore(
                    "tier-1",
                    [Ben, Anna],
                    [new ValueId("wert-1")],
                    Anna,
                    false,
                    tierOneActions
                ),
                Group.Restore("tier-2", [Chris], [new ValueId("wert-2")], Chris, true, []),
            ]
        );
    }
}
