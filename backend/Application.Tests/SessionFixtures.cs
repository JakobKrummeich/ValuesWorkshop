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
        Guid.Parse("00000000-0000-0000-0000-0000000000c3")
    );

    internal static Session InPhase(
        Phase phase,
        QuizProgress? quiz = null,
        SelectionRound? selection = null,
        FormationRecord? formation = null,
        PresentationWalk? presentation = null,
        VotingRounds? voting = null,
        long revision = 0
    )
    {
        return Session.Restore(
            new SessionIdentity(Guid.Parse("00000000-0000-0000-0000-00000000f00d")),
            TestSessions.Facilitator,
            TestSessions.Name,
            Roster.Restore([Anna, Ben, Chris]),
            PhaseProgress.Restore(phase),
            quiz ?? QuizProgress.Restore(null, false, false),
            selection ?? SelectionRound.Restore([], []),
            formation ?? FormationRecord.Restore(false, []),
            presentation ?? PresentationWalk.Restore(null, null, 0),
            voting ?? VotingRounds.Restore(false, 0, []),
            revision
        );
    }

    internal static FormationRecord TwoGroups()
    {
        return FormationRecord.Restore(
            true,
            [
                Group.Restore("fox", [Anna, Ben], [new ValueId("honesty")], Anna, false),
                Group.Restore("owl", [Chris], [new ValueId("courage")], Chris, true),
            ]
        );
    }
}
