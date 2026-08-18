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
