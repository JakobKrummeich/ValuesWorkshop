namespace ValuesWorkshop.Domain;

public sealed record FinalVotingExitGuard : IPhaseExitGuard
{
    public Phase Phase => Phase.FinalVoting;

    public string Refusal => "Final voting is left once the winning values stand.";

    public bool IsSatisfiedBy(Session session)
    {
        return session.Voting.WinnersStand;
    }
}
