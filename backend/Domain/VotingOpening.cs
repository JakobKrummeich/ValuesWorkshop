namespace ValuesWorkshop.Domain;

public sealed class VotingOpening : IPhaseEntryAction
{
    public void ExecuteFor(Session session)
    {
        if (session.PhaseProgress.CurrentPhase != Phase.FinalVoting)
        {
            return;
        }

        session.Voting.OpenRound(
            VotingRounds.RequiredWinningValueCount,
            session.Formation.Groups.SelectMany(group => group.AssignedValues).ToList()
        );
    }
}
