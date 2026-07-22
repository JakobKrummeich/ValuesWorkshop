namespace ValuesWorkshop.Domain;

public sealed class FormationRecord
{
    private readonly List<Group> _groups = [];

    public bool IsFormed { get; private set; }
    public IReadOnlyList<Group> Groups => _groups;

    internal static FormationRecord Restore(bool isFormed, IEnumerable<Group> groups)
    {
        var record = new FormationRecord { IsFormed = isFormed };
        record._groups.AddRange(groups);
        return record;
    }
}
