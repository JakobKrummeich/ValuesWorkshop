using ValuesWorkshop.Domain;

namespace ValuesWorkshop.TestSupport;

public sealed class TestGroupSolver : IGroupSolver
{
    public GroupSolverOutcome Solve(
        GroupFormationRequest request,
        CancellationToken cancellationToken
    )
    {
        var memberCounts = GroupSizing.ParticipantCountsPerGroup(request.Participants.Count);
        var valueCounts = GroupSizing.ValueCountsPerGroup(
            request.TopValues.Count,
            memberCounts.Count
        );

        var groups = new List<FormedGroup>();
        var nextMember = 0;
        var nextValue = 0;

        for (var groupIndex = 0; groupIndex < memberCounts.Count; groupIndex++)
        {
            var members = request
                .Participants.Skip(nextMember)
                .Take(memberCounts[groupIndex])
                .Select(participant => participant.ParticipantId)
                .ToList();
            var assignedValues = request
                .TopValues.Skip(nextValue)
                .Take(valueCounts[groupIndex])
                .ToList();

            nextMember += memberCounts[groupIndex];
            nextValue += valueCounts[groupIndex];

            groups.Add(new FormedGroup(members, assignedValues));
        }

        return new GroupSolverOutcome.Assigned(new GroupFormationResult(groups));
    }
}
