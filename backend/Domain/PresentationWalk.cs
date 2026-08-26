namespace ValuesWorkshop.Domain;

public sealed class PresentationWalk
{
    public string? PresentingGroup { get; private set; }
    public ValueId? PresentedValue { get; private set; }
    public int ShownValueCount { get; private set; }

    public bool IsPresentationComplete(int presentedValueCount)
    {
        return ShownValueCount >= presentedValueCount;
    }

    public bool HasNextPosition(IReadOnlyList<Group> groups)
    {
        var positions = PositionsOf(groups);
        var currentIndex = CurrentIndexIn(positions);

        return currentIndex >= 0 && currentIndex < positions.Count - 1;
    }

    internal void Open(IReadOnlyList<Group> groups)
    {
        if (PresentingGroup is not null || groups.Count == 0)
        {
            return;
        }

        PresentingGroup = groups[0].Name;
    }

    internal void GoToNextValue(IReadOnlyList<Group> groups)
    {
        var positions = PositionsOf(groups);
        var currentIndex = CurrentIndexIn(positions);

        if (currentIndex < 0)
        {
            throw new InvariantViolationException(
                "No group is presenting until value presentation begins."
            );
        }

        if (currentIndex == positions.Count - 1)
        {
            throw new InvariantViolationException(
                "Every group's every value has been shown; nothing is left to present."
            );
        }

        var (groupName, value) = positions[currentIndex + 1];

        PresentingGroup = groupName;
        PresentedValue = value;

        if (value is not null)
        {
            ShownValueCount++;
        }
    }

    private int CurrentIndexIn(List<(string GroupName, ValueId? Value)> positions)
    {
        return positions.FindIndex(position =>
            position.GroupName == PresentingGroup && position.Value == PresentedValue
        );
    }

    private static List<(string GroupName, ValueId? Value)> PositionsOf(IReadOnlyList<Group> groups)
    {
        var positions = new List<(string GroupName, ValueId? Value)>();

        foreach (var group in groups)
        {
            positions.Add((group.Name, null));

            foreach (var value in group.AssignedValues)
            {
                positions.Add((group.Name, value));
            }
        }

        return positions;
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
