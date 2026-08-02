namespace ValuesWorkshop.Domain;

public sealed record ValuePresentationExitGuard(int PresentedValueCount) : IPhaseExitGuard
{
    public Phase Phase => Phase.ValuePresentation;

    public string Refusal =>
        "Value presentation is left once every group's every value has been shown.";

    public bool IsSatisfiedBy(Session session)
    {
        return session.Presentation.IsPresentationComplete(PresentedValueCount);
    }
}
