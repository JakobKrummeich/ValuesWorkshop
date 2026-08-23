namespace ValuesWorkshop.Domain.Tests;

public class RandomGroupAssignmentTests
{
    [Fact]
    public void Groups_are_sized_by_the_sizing_rule()
    {
        var assignment = RandomGroupAssignment.For(RequestOf(9, 3), new FixedRandomness(0));

        assignment.Groups.Select(group => group.Members.Count).ShouldBe([5, 4]);
        assignment.Groups.Select(group => group.AssignedValues.Count).ShouldBe([2, 1]);
    }

    [Fact]
    public void Every_participant_lands_in_exactly_one_group()
    {
        var request = RequestOf(9, 3);

        var assignment = RandomGroupAssignment.For(request, new FixedRandomness(1));

        assignment
            .Groups.SelectMany(group => group.Members)
            .ShouldBe(
                request.Participants.Select(participant => participant.ParticipantId),
                ignoreOrder: true
            );
    }

    [Fact]
    public void Every_top_value_is_dealt_to_exactly_one_group()
    {
        var request = RequestOf(9, 3);

        var assignment = RandomGroupAssignment.For(request, new FixedRandomness(1));

        assignment
            .Groups.SelectMany(group => group.AssignedValues)
            .ShouldBe(request.TopValues, ignoreOrder: true);
    }

    [Fact]
    public void Randomness_decides_who_shares_a_group()
    {
        var request = RequestOf(4, 2);

        var firstMembers = RandomGroupAssignment
            .For(request, new FixedRandomness(0))
            .Groups[0]
            .Members;
        var otherMembers = RandomGroupAssignment
            .For(request, new FixedRandomness(1))
            .Groups[0]
            .Members;

        firstMembers.ShouldNotBe(otherMembers);
    }

    [Fact]
    public void A_room_too_small_for_two_groups_becomes_one_group()
    {
        var assignment = RandomGroupAssignment.For(RequestOf(3, 4), new FixedRandomness(0));

        assignment.Groups.Count.ShouldBe(1);
        assignment.Groups[0].Members.Count.ShouldBe(3);
        assignment.Groups[0].AssignedValues.Count.ShouldBe(4);
    }

    private static GroupFormationRequest RequestOf(int participantCount, int topValueCount)
    {
        var topValues = TestValueIds.Numbered(1, topValueCount);
        var participants = Enumerable
            .Range(1, participantCount)
            .Select(number => new ParticipantSelection(
                new ParticipantId(new Guid(number, 0, 0, [0, 0, 0, 0, 0, 0, 0, 0])),
                topValues
            ))
            .ToList();

        return new GroupFormationRequest(participants, topValues);
    }
}
