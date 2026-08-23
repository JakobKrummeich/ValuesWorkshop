namespace ValuesWorkshop.Domain;

public static class GroupSizing
{
    private const int TargetGroupSize = 4;

    public static int GroupCount(int participantCount) =>
        Math.Max(1, participantCount / TargetGroupSize);

    public static IReadOnlyList<int> ParticipantCountsPerGroup(int participantCount) =>
        DealOut(participantCount, GroupCount(participantCount));

    public static IReadOnlyList<int> ValueCountsPerGroup(int valueCount, int groupCount) =>
        DealOut(valueCount, groupCount);

    public static IReadOnlyList<IReadOnlyList<TItem>> Deal<TItem>(
        IReadOnlyList<TItem> items,
        IReadOnlyList<int> countsPerGroup
    )
    {
        var dealt = new List<IReadOnlyList<TItem>>();
        var nextItem = 0;

        foreach (var count in countsPerGroup)
        {
            dealt.Add(items.Skip(nextItem).Take(count).ToList());
            nextItem += count;
        }

        return dealt;
    }

    private static IReadOnlyList<int> DealOut(int itemCount, int groupCount)
    {
        var baseCount = itemCount / groupCount;
        var groupsWithExtraItem = itemCount % groupCount;

        return Enumerable
            .Range(0, groupCount)
            .Select(groupIndex => groupIndex < groupsWithExtraItem ? baseCount + 1 : baseCount)
            .ToList();
    }
}
