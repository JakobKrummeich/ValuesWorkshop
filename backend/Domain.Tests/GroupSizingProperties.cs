using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

namespace ValuesWorkshop.Domain.Tests;

public class GroupSizingProperties
{
    private static readonly Arbitrary<int> ParticipantCounts = WorkshopGenerators.CountBetween(
        0,
        200
    );
    private static readonly Arbitrary<int> ValueCounts = WorkshopGenerators.CountBetween(0, 60);
    private static readonly Arbitrary<int> GroupCounts = WorkshopGenerators.CountBetween(1, 15);

    [Property]
    public Property Every_participant_gets_a_seat_in_a_group_whose_size_is_within_one_of_every_other()
    {
        return Prop.ForAll(
            ParticipantCounts,
            participantCount =>
            {
                var sizes = GroupSizing.ParticipantCountsPerGroup(participantCount);

                sizes.Count.ShouldBe(GroupSizing.GroupCount(participantCount));
                sizes.Sum().ShouldBe(participantCount);
                (sizes.Max() - sizes.Min()).ShouldBeLessThanOrEqualTo(1);
            }
        );
    }

    [Property]
    public Property Earlier_groups_take_the_extra_members()
    {
        return Prop.ForAll(
            ParticipantCounts,
            participantCount =>
                GroupSizing
                    .ParticipantCountsPerGroup(participantCount)
                    .Zip(GroupSizing.ParticipantCountsPerGroup(participantCount).Skip(1))
                    .ShouldAllBe(pair => pair.First >= pair.Second)
        );
    }

    [Property]
    public Property No_group_stays_empty_once_somebody_is_present()
    {
        return Prop.ForAll(
            WorkshopGenerators.CountBetween(1, 200),
            participantCount =>
                GroupSizing
                    .ParticipantCountsPerGroup(participantCount)
                    .ShouldAllBe(size => size >= 1)
        );
    }

    [Property]
    public Property Every_top_value_is_dealt_out_once_across_groups_within_one_of_each_other()
    {
        return Prop.ForAll(
            ValueCounts,
            GroupCounts,
            (valueCount, groupCount) =>
            {
                var counts = GroupSizing.ValueCountsPerGroup(valueCount, groupCount);

                counts.Count.ShouldBe(groupCount);
                counts.Sum().ShouldBe(valueCount);
                (counts.Max() - counts.Min()).ShouldBeLessThanOrEqualTo(1);
            }
        );
    }

    [Property]
    public Property Dealing_hands_every_item_out_exactly_once_and_in_order()
    {
        return Prop.ForAll(
            ValueCounts,
            GroupCounts,
            (itemCount, groupCount) =>
            {
                var items = TestValueIds.Numbered(1, itemCount);
                var countsPerGroup = GroupSizing.ValueCountsPerGroup(itemCount, groupCount);

                var dealt = GroupSizing.Deal(items, countsPerGroup);

                dealt.Select(group => group.Count).ShouldBe(countsPerGroup);
                dealt.SelectMany(group => group).ShouldBe(items);
            }
        );
    }
}
