namespace ValuesWorkshop.Domain.Tests;

public class GroupSizingTests
{
    [Theory]
    [InlineData(30, 7)]
    [InlineData(8, 2)]
    [InlineData(7, 1)]
    [InlineData(4, 1)]
    [InlineData(0, 1)]
    public void Group_count_is_participants_divided_by_four_but_at_least_one(
        int participantCount,
        int expectedGroupCount
    )
    {
        GroupSizing.GroupCount(participantCount).ShouldBe(expectedGroupCount);
    }

    [Fact]
    public void Thirty_participants_form_seven_groups_sized_5_5_4_4_4_4_4()
    {
        GroupSizing.ParticipantCountsPerGroup(30).ShouldBe([5, 5, 4, 4, 4, 4, 4]);
    }

    [Theory]
    [InlineData(4, new[] { 4 })]
    [InlineData(7, new[] { 7 })]
    [InlineData(8, new[] { 4, 4 })]
    [InlineData(0, new[] { 0 })]
    public void Fewer_than_eight_participants_stay_in_a_single_group(
        int participantCount,
        int[] expectedSizes
    )
    {
        GroupSizing.ParticipantCountsPerGroup(participantCount).ShouldBe(expectedSizes);
    }

    [Fact]
    public void Ten_values_over_seven_groups_deal_out_as_2_2_2_1_1_1_1()
    {
        GroupSizing
            .ValueCountsPerGroup(valueCount: 10, groupCount: 7)
            .ShouldBe([2, 2, 2, 1, 1, 1, 1]);
    }

    [Fact]
    public void Six_values_over_two_groups_deal_out_as_3_3()
    {
        GroupSizing.ValueCountsPerGroup(valueCount: 6, groupCount: 2).ShouldBe([3, 3]);
    }

    [Fact]
    public void No_values_deal_out_as_all_zeros()
    {
        GroupSizing.ValueCountsPerGroup(valueCount: 0, groupCount: 3).ShouldBe([0, 0, 0]);
    }
}
