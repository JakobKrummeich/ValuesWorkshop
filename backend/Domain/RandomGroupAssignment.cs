namespace ValuesWorkshop.Domain;

public static class RandomGroupAssignment
{
    public static GroupFormationResult For(GroupFormationRequest request, IRandomness randomness)
    {
        var memberCounts = GroupSizing.ParticipantCountsPerGroup(request.Participants.Count);
        var valueCounts = GroupSizing.ValueCountsPerGroup(
            request.TopValues.Count,
            memberCounts.Count
        );

        var membersPerGroup = GroupSizing.Deal(
            Shuffled(
                request.Participants.Select(participant => participant.ParticipantId).ToList(),
                randomness
            ),
            memberCounts
        );
        var valuesPerGroup = GroupSizing.Deal(Shuffled(request.TopValues, randomness), valueCounts);

        return new GroupFormationResult(
            membersPerGroup
                .Select(
                    (members, groupIndex) => new FormedGroup(members, valuesPerGroup[groupIndex])
                )
                .ToList()
        );
    }

    private static IReadOnlyList<TItem> Shuffled<TItem>(
        IReadOnlyList<TItem> items,
        IRandomness randomness
    )
    {
        var shuffled = items.ToList();

        for (var index = shuffled.Count - 1; index > 0; index--)
        {
            var swapWith = randomness.NextIndex(index + 1);
            (shuffled[index], shuffled[swapWith]) = (shuffled[swapWith], shuffled[index]);
        }

        return shuffled;
    }
}
