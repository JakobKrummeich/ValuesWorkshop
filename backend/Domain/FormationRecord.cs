namespace ValuesWorkshop.Domain;

public sealed class FormationRecord
{
    private readonly List<Group> _groups = [];

    public bool IsFormed { get; private set; }
    public IReadOnlyList<Group> Groups => _groups;
}
