namespace ValuesWorkshop.Domain;

public static class FinalVoting
{
    public static void SubmitVotes(
        Session session,
        ParticipantId caller,
        IReadOnlyDictionary<ValueId, int> votes
    )
    {
        if (!session.Roster.Contains(caller))
        {
            throw new NotAuthorizedException("Only a joined participant may cast final votes.");
        }

        RequireFinalVotingPhase(session);

        session.Voting.RecordBallot(caller, votes);
    }

    public static void CloseVoting(Session session)
    {
        RequireFinalVotingPhase(session);

        session.Voting.CloseRound();
    }

    public static void StartTiebreakRound(Session session)
    {
        RequireFinalVotingPhase(session);

        session.Voting.StartTiebreak();
    }

    private static void RequireFinalVotingPhase(Session session)
    {
        if (session.PhaseProgress.CurrentPhase != Phase.FinalVoting)
        {
            throw new WrongPhaseException(
                "The voting commands exist only during the final-voting phase."
            );
        }
    }
}
