namespace ValuesWorkshop.Domain;

public sealed class PresentationWalk
{
    public string? PresentingGroup { get; private set; }
    public ValueId? PresentedValue { get; private set; }

    internal static PresentationWalk Restore(string? presentingGroup, ValueId? presentedValue)
    {
        return new PresentationWalk
        {
            PresentingGroup = presentingGroup,
            PresentedValue = presentedValue,
        };
    }
}
