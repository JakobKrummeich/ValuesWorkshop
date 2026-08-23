namespace ValuesWorkshop.Domain;

public sealed record GroupFormationExitGuard : IPhaseExitGuard
{
    public Phase Phase => Phase.GroupFormation;

    public string Refusal => "Group formation is left once the groups stand.";

    public bool IsSatisfiedBy(Session session)
    {
        return session.Formation.IsFormed;
    }
}
