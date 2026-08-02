namespace ValuesWorkshop.Domain;

public sealed class PresentationWalk
{
    public string? PresentingGroup { get; private set; }
    public ValueId? PresentedValue { get; private set; }
    public int ShownValueCount { get; private set; }

    public bool IsWalkComplete(int presentedValueCount)
    {
        return ShownValueCount >= presentedValueCount;
    }

    internal static PresentationWalk Restore(
        string? presentingGroup,
        ValueId? presentedValue,
        int shownValueCount
    )
    {
        return new PresentationWalk
        {
            PresentingGroup = presentingGroup,
            PresentedValue = presentedValue,
            ShownValueCount = shownValueCount,
        };
    }
}
