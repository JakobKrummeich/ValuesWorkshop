namespace ValuesWorkshop.Domain;

public abstract record PhaseExitGuard(Phase Phase)
{
    public abstract string Refusal { get; }

    public abstract bool IsSatisfiedBy(Session session);
}
