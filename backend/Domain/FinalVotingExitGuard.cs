namespace ValuesWorkshop.Domain;

public sealed record FinalVotingExitGuard() : PhaseExitGuard(Phase.FinalVoting)
{
    public override string Refusal => "Final voting is left once the winning values stand.";

    public override bool IsSatisfiedBy(Session session)
    {
        return session.Voting.WinnersStand;
    }
}
