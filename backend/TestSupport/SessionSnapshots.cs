using ValuesWorkshop.Domain;

namespace ValuesWorkshop.TestSupport;

public static class SessionSnapshots
{
    public static Session Of(Session session)
    {
        return Session.Restore(
            session.Identity,
            session.Facilitator,
            session.Name,
            Roster.Restore(session.Roster.Participants),
            PhaseProgress.Restore(session.PhaseProgress.CurrentPhase),
            QuizProgress.Restore(
                session.Quiz.CurrentQuestionIndex,
                session.Quiz.IsRevealed,
                session.Quiz.IsLearningTextShown,
                session.Quiz.CastAnswers
            ),
            SelectionRound.Restore(session.Selection.SelectedValues, session.Selection.TopValues),
            FormationRecord.Restore(
                session.Formation.IsFormed,
                session.Formation.Groups.Select(Of)
            ),
            PresentationWalk.Restore(
                session.Presentation.PresentingGroup,
                session.Presentation.PresentedValue,
                session.Presentation.ShownValueCount
            ),
            VotingRounds.Restore([.. session.Voting.ClosedRounds], OpenRoundOf(session.Voting)),
            WinnerReveal.Restore(session.Reveal.RevealedCount),
            session.Revision
        );
    }

    private static Group Of(Group group)
    {
        return Group.Restore(
            group.Name,
            [.. group.Members],
            [.. group.AssignedValues],
            group.Scribe,
            group.IsSubmitted,
            [.. group.Actions]
        );
    }

    private static OpenVotingRound? OpenRoundOf(VotingRounds voting)
    {
        return voting.RoundOpen
            ? new OpenVotingRound(
                voting.RoundNumber,
                voting.Allotment,
                voting.EligibleValues,
                voting.OpenRoundTallies,
                voting.OpenRoundVotedParticipants
            )
            : null;
    }
}
