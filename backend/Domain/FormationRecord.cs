namespace ValuesWorkshop.Domain;

/// <summary>The one-time group/value partition. Enforces I8.</summary>
public sealed class FormationRecord
{
    private readonly List<Group> _groups = [];

    public bool IsFormed { get; private set; }
    public IReadOnlyList<Group> Groups => _groups;
}
