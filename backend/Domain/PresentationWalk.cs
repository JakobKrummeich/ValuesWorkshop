namespace ValuesWorkshop.Domain;

/// <summary>Presenting group + presented value position. Enforces I12.</summary>
public sealed class PresentationWalk
{
    public string? PresentingGroup { get; private set; }
    public ValueId? PresentedValue { get; private set; }
}
