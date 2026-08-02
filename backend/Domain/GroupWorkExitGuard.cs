namespace ValuesWorkshop.Domain;

public sealed record GroupWorkExitGuard() : PhaseExitGuard(Phase.GroupWork)
{
    public override string Refusal =>
        "Group work is left once every group has submitted its result.";

    public override bool IsSatisfiedBy(Session session)
    {
        return session.Formation.IsEveryGroupSubmitted;
    }
}
