namespace ValuesWorkshop.Domain;

public sealed class FormationRecord
{
    private readonly List<Group> _groups = [];

    public bool IsFormed { get; private set; }
    public IReadOnlyList<Group> Groups => _groups;
    public bool IsEveryGroupSubmitted => _groups.TrueForAll(group => group.IsSubmitted);

    internal void Form(GroupFormationResult formationResult, IReadOnlyList<string> animalNames)
    {
        if (formationResult.Groups.Count > animalNames.Count)
        {
            throw new InvariantViolationException(
                $"Group formation needs {formationResult.Groups.Count} animal names but only {animalNames.Count} exist."
            );
        }

        _groups.AddRange(
            formationResult.Groups.Select(
                (formedGroup, groupIndex) =>
                    new Group(
                        animalNames[groupIndex],
                        formedGroup.Members,
                        formedGroup.AssignedValues
                    )
            )
        );
        IsFormed = true;
    }

    internal void PlaceIntoSmallestGroup(ParticipantId participantId, IRandomness randomness)
    {
        if (_groups.Count == 0)
            throw new InvariantViolationException(
                "Cannot place participant into a formation with no groups."
            );

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
