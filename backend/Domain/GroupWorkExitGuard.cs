namespace ValuesWorkshop.Domain;

public sealed record GroupWorkExitGuard : IPhaseExitGuard
{
    public Phase Phase => Phase.GroupWork;

    public string Refusal => "Group work is left once every group has submitted its result.";

    public bool IsSatisfiedBy(Session session)
    {
        return session.Formation.IsEveryGroupSubmitted;
    }
}
