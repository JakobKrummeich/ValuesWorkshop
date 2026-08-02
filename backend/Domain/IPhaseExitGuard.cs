namespace ValuesWorkshop.Domain;

public interface IPhaseExitGuard
{
    Phase Phase { get; }

    string Refusal { get; }

    bool IsSatisfiedBy(Session session);
}
