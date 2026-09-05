using System.Diagnostics;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Host.Tests;

public sealed class CpSatGroupSolverTests
{
    private readonly CpSatGroupSolver solver = new();

    [Fact]
    public void Thirty_participants_and_ten_values_form_a_valid_partition()
    {
        var request = ThirtyParticipantRequest();

        var result = Solved(request);

        result.Groups.Select(group => group.Members.Count).ShouldBe([5, 5, 4, 4, 4, 4, 4]);
        result.Groups.Select(group => group.AssignedValues.Count).ShouldBe([2, 2, 2, 1, 1, 1, 1]);
        result
            .Groups.SelectMany(group => group.Members)
            .ShouldBe(
                request.Participants.Select(participant => participant.ParticipantId),
                ignoreOrder: true
            );
        result
            .Groups.SelectMany(group => group.AssignedValues)
            .ShouldBe(request.TopValues, ignoreOrder: true);
    }

    [Fact]
    public void Thirty_participants_solve_within_three_seconds()
    {
        var request = ThirtyParticipantRequest();

        Timed(() => Solved(request)).ShouldBeLessThan(TimeSpan.FromSeconds(3));
    }

    [Fact]
    public void The_hand_worked_eight_participant_instance_reaches_its_proven_optimum_of_22()
    {
        var request = HandWorkedRequest();

        var result = Solved(request);

        AchievedOverlap(request, result).ShouldBe(22);
    }

    [Fact]
    public void The_hand_worked_eight_participant_instance_forms_the_unique_optimal_groups()
    {
        var result = Solved(HandWorkedRequest());

        result.Groups.Count.ShouldBe(2);
        var groupAroundA = result.Groups.Single(group => group.Members.Contains(Named('a')));
        var groupAroundF = result.Groups.Single(group => group.Members.Contains(Named('f')));
        groupAroundA.Members.ShouldBe([Named('a'), Named('b'), Named('c'), Named('d')]);
        groupAroundA.AssignedValues.ShouldBe([Value("v1"), Value("v2"), Value("v3")]);
        groupAroundF.Members.ShouldBe([Named('e'), Named('f'), Named('g'), Named('h')]);
        groupAroundF.AssignedValues.ShouldBe([Value("v4"), Value("v5"), Value("v6")]);
    }

    [Fact]
    public void Nine_participants_with_disjoint_interests_form_the_unique_optimal_groups()
    {
        var request = DisjointInterestsRequest();

        var result = Solved(request);

        AchievedOverlap(request, result).ShouldBe(18);
        ShouldBeDisjointInterestsOptimum(result);
    }

    [Fact]
    public void Selections_outside_the_top_values_are_dropped()
    {
        var request = DisjointInterestsRequest(extraSelection: new ValueId("not-in-top"));

        var result = Solved(request);

        ShouldBeDisjointInterestsOptimum(result);
    }

    [Fact]
    public void No_participants_yield_one_empty_group_holding_every_value()
    {
        var topValues = new[] { Value("v1"), Value("v2"), Value("v3") };

        var result = Solved(new GroupFormationRequest([], topValues));

        var onlyGroup = result.Groups.ShouldHaveSingleItem();
        onlyGroup.Members.ShouldBeEmpty();
        onlyGroup.AssignedValues.ShouldBe(topValues);
    }

    [Fact]
    public void No_top_values_yield_groups_with_members_and_no_values()
    {
        var participants = FivePeopleSelecting(Value("dropped-with-the-top-set"));

        var result = Solved(new GroupFormationRequest(participants, []));

        var onlyGroup = result.Groups.ShouldHaveSingleItem();
        onlyGroup.Members.ShouldBe(participants.Select(participant => participant.ParticipantId));
        onlyGroup.AssignedValues.ShouldBeEmpty();
    }

    [Fact]
    public void Fewer_than_eight_participants_form_one_group_holding_every_value()
    {
        var topValues = new[] { Value("v1"), Value("v2"), Value("v3"), Value("v4") };
        var participants = FivePeopleSelecting(Value("v1"), Value("v4"));

        var result = Solved(new GroupFormationRequest(participants, topValues));

        var onlyGroup = result.Groups.ShouldHaveSingleItem();
        onlyGroup.Members.ShouldBe(participants.Select(participant => participant.ParticipantId));
        onlyGroup.AssignedValues.ShouldBe(topValues);
    }

    [Fact]
    public void The_same_request_forms_the_same_groups_every_time()
    {
        var request = DenseThirtyParticipantRequest();

        var firstResult = Solved(request);
        var secondResult = Solved(request);

        firstResult.Groups.Count.ShouldBe(secondResult.Groups.Count);
        foreach (var (firstGroup, secondGroup) in firstResult.Groups.Zip(secondResult.Groups))
        {
            firstGroup.Members.ShouldBe(secondGroup.Members);
            firstGroup.AssignedValues.ShouldBe(secondGroup.AssignedValues);
        }
    }

    [Fact]
    public void A_solve_stopped_mid_search_hands_over_the_best_assignment_found_so_far()
    {
        var request = ThirtyParticipantRequest();
        var fullSolve = Timed(() => Solved(request));
        using var stopMidSearch = new CancellationTokenSource(fullSolve / 2);

        var stopwatch = Stopwatch.StartNew();
        var outcome = solver.Solve(request, stopMidSearch.Token);
        stopwatch.Stop();

        stopwatch.Elapsed.ShouldBeLessThan(fullSolve);
        var assignment = outcome.ShouldBeOfType<GroupSolverOutcome.Assigned>().Assignment;
        assignment
            .Groups.SelectMany(group => group.Members)
            .ShouldBe(
                request.Participants.Select(participant => participant.ParticipantId),
                ignoreOrder: true
            );
        assignment
            .Groups.Select(group => group.Members.Count)
            .ShouldBe(GroupSizing.ParticipantCountsPerGroup(request.Participants.Count));
    }

    [Fact]
    public void A_solve_stopped_before_it_started_hands_over_nothing()
    {
        using var stoppedAlready = new CancellationTokenSource();
        stoppedAlready.Cancel();

        var outcome = solver.Solve(ThirtyParticipantRequest(), stoppedAlready.Token);

        outcome.ShouldBeOfType<GroupSolverOutcome.StoppedWithoutAssignment>();
    }

    private GroupFormationResult Solved(GroupFormationRequest request)
    {
        return solver
            .Solve(request, CancellationToken.None)
            .ShouldBeOfType<GroupSolverOutcome.Assigned>()
            .Assignment;
    }

    private static TimeSpan Timed(Action action)
    {
        var stopwatch = Stopwatch.StartNew();
        action();

        return stopwatch.Elapsed;
    }

    private static GroupFormationRequest HandWorkedRequest()
    {
        var topValues = Enumerable.Range(1, 6).Select(number => Value($"v{number}")).ToList();
        var selections = new Dictionary<char, string[]>
        {
            ['a'] = ["v1", "v2", "v3"],
            ['b'] = ["v1", "v2", "v3"],
            ['c'] = ["v1", "v2", "v3"],
            ['d'] = ["v1", "v2", "v4"],
            ['e'] = ["v1", "v4", "v5"],
            ['f'] = ["v4", "v5", "v6"],
            ['g'] = ["v4", "v5", "v6"],
            ['h'] = ["v4", "v5", "v6"],
        };
        var participants = selections
            .Select(entry => new ParticipantSelection(
                Named(entry.Key),
                entry.Value.Select(Value).ToList()
            ))
            .ToList();

        return new GroupFormationRequest(participants, topValues);
    }

    private static GroupFormationRequest DisjointInterestsRequest(ValueId? extraSelection = null)
    {
        var topValues = Enumerable.Range(1, 4).Select(number => Value($"w{number}")).ToList();
        var participants = Enumerable
            .Range(1, 9)
            .Select(number => new ParticipantSelection(
                Numbered(number),
                number <= 5
                    ? WithExtra([Value("w1"), Value("w2")], number == 1 ? extraSelection : null)
                    : [Value("w3"), Value("w4")]
            ))
            .ToList();

        return new GroupFormationRequest(participants, topValues);
    }

    private static void ShouldBeDisjointInterestsOptimum(GroupFormationResult result)
    {
        result.Groups.Count.ShouldBe(2);
        result.Groups[0].Members.ShouldBe(Enumerable.Range(1, 5).Select(Numbered));
        result.Groups[0].AssignedValues.ShouldBe([Value("w1"), Value("w2")]);
        result.Groups[1].Members.ShouldBe(Enumerable.Range(6, 4).Select(Numbered));
        result.Groups[1].AssignedValues.ShouldBe([Value("w3"), Value("w4")]);
    }

    private static IReadOnlyList<ValueId> WithExtra(List<ValueId> selection, ValueId? extra)
    {
        if (extra is { } extraValue)
        {
            selection.Add(extraValue);
        }

        return selection;
    }

    private static List<ParticipantSelection> FivePeopleSelecting(params ValueId[] selection)
    {
        return Enumerable
            .Range(1, 5)
            .Select(number => new ParticipantSelection(Numbered(number), selection))
            .ToList();
    }

    private static int AchievedOverlap(GroupFormationRequest request, GroupFormationResult result)
    {
        var selectionsById = request.Participants.ToDictionary(
            participant => participant.ParticipantId,
            participant => participant.SelectedValues
        );

        return result.Groups.Sum(group =>
            group.Members.Sum(member => selectionsById[member].Count(group.AssignedValues.Contains))
        );
    }

    private static ParticipantId Named(char letter) =>
        new(new Guid($"00000000-0000-0000-0000-0000000000{(int)letter:x2}"));

    private static ParticipantId Numbered(int number) =>
        new(new Guid($"00000000-0000-0000-0000-0000000001{number:x2}"));

    private static ValueId Value(string valueId) => new(valueId);

    private static GroupFormationRequest DenseThirtyParticipantRequest()
    {
        var topValues = Enumerable.Range(0, 10).Select(index => new ValueId($"v{index}")).ToList();
        var random = new Random(2024);
        var participants = Enumerable
            .Range(0, 30)
            .Select(index => new ParticipantSelection(
                new ParticipantId(Guid.NewGuid()),
                topValues.OrderBy(_ => random.Next()).Take(6).ToList()
            ))
            .ToList();

        return new GroupFormationRequest(participants, topValues);
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
