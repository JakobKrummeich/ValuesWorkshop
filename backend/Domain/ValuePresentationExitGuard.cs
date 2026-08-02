namespace ValuesWorkshop.Domain;

public sealed record ValuePresentationExitGuard(int PresentedValueCount)
    : PhaseExitGuard(Phase.ValuePresentation)
{
    public override string Refusal =>
        "Value presentation is left once every group's every value has been shown.";

    public override bool IsSatisfiedBy(Session session)
    {
        return session.Presentation.IsPresentationComplete(PresentedValueCount);
    }
}
