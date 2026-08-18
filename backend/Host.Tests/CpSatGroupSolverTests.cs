using System.Diagnostics;
using ValuesWorkshop.Application.Ports.Driven;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Host.Tests;

public sealed class CpSatGroupSolverTests
{
    private readonly CpSatGroupSolver solver = new();

    [Fact]
    public void Thirty_participants_and_ten_values_form_a_valid_partition()
    {
        var request = ThirtyParticipantRequest();

        var result = solver.Solve(request);

        result.Groups.Select(group => group.Members.Count).ShouldBe([5, 5, 4, 4, 4, 4, 4]);
        result.Groups.Select(group => group.AssignedValues.Count).ShouldBe([2, 2, 2, 1, 1, 1, 1]);
        result
            .Groups.SelectMany(group => group.Members)
            .ShouldBe(request.Participants.Select(p => p.ParticipantId), ignoreOrder: true);
        result
            .Groups.SelectMany(group => group.AssignedValues)
            .ShouldBe(request.TopValues, ignoreOrder: true);
    }

    [Fact]
    public void Thirty_participants_solve_within_three_seconds()
    {
        var request = ThirtyParticipantRequest();

        var stopwatch = Stopwatch.StartNew();
        solver.Solve(request);
        stopwatch.Stop();

        stopwatch.ElapsedMilliseconds.ShouldBeLessThan(3000);
    }

    private static GroupFormationRequest ThirtyParticipantRequest()
    {
        var topValues = Enumerable.Range(0, 10).Select(index => new ValueId($"v{index}")).ToList();
        var participants = Enumerable
            .Range(0, 30)
            .Select(index => new ParticipantSelection(
                new ParticipantId(Guid.NewGuid()),
                [topValues[index % 10], topValues[(index + 3) % 10], topValues[(index + 7) % 10]]
            ))
            .ToList();

        return new GroupFormationRequest(participants, topValues);
    }
}
