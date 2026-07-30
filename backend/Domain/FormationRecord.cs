namespace ValuesWorkshop.Domain;

public sealed class FormationRecord
{
    private readonly List<Group> _groups = [];

    public bool IsFormed { get; private set; }
    public IReadOnlyList<Group> Groups => _groups;

    internal void PlaceIntoSmallestGroup(ParticipantId participantId, IRandomness randomness)
    {
        var smallestSize = _groups.Min(group => group.Members.Count);
        var candidates = _groups.Where(group => group.Members.Count == smallestSize).ToList();

        candidates[randomness.NextIndex(candidates.Count)].AddMember(participantId);
    }

    internal static FormationRecord Restore(bool isFormed, IEnumerable<Group> groups)
    {
        var record = new FormationRecord { IsFormed = isFormed };
        record._groups.AddRange(groups);
        return record;
    }
}
