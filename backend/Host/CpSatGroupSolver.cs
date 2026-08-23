using Google.OrTools.Sat;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Host;

public sealed class CpSatGroupSolver : IGroupSolver
{
    private const string SolverParameters =
        "random_seed:42 num_search_workers:1 linearization_level:2 "
        + "max_deterministic_time:1.5 max_time_in_seconds:2.5";

    public GroupFormationResult Solve(
        GroupFormationRequest request,
        CancellationToken cancellationToken
    )
    {
        var groupCount = GroupSizing.GroupCount(request.Participants.Count);
        var memberCounts = GroupSizing.ParticipantCountsPerGroup(request.Participants.Count);
        var valueCounts = GroupSizing.ValueCountsPerGroup(request.TopValues.Count, groupCount);

        var model = new CpModel();
        var participantInGroup = AddExactAssignments(
            model,
            "participant",
            request.Participants.Count,
            memberCounts
        );
        var valueInGroup = AddExactAssignments(
            model,
            "value",
            request.TopValues.Count,
            valueCounts
        );
        AddOverlapMaximization(
            model,
            SelectedValueIndices(request),
            participantInGroup,
            valueInGroup,
            memberCounts,
            valueCounts
        );

        var cpSolver = new CpSolver { StringParameters = SolverParameters };
        using var stopWhenCancelled = cancellationToken.Register(cpSolver.StopSearch);
        var status = cpSolver.Solve(model);
        cancellationToken.ThrowIfCancellationRequested();

        if (status is not (CpSolverStatus.Optimal or CpSolverStatus.Feasible))
        {
            throw new InvalidOperationException(
                $"Group formation found no assignment (solver status {status})."
            );
        }

        return ExtractGroups(cpSolver, request, participantInGroup, valueInGroup, groupCount);
    }

    private static BoolVar[,] AddExactAssignments(
        CpModel model,
        string itemLabel,
        int itemCount,
        IReadOnlyList<int> countsPerGroup
    )
    {
        var groupCount = countsPerGroup.Count;
        var itemInGroup = new BoolVar[itemCount, groupCount];

        for (var item = 0; item < itemCount; item++)
        {
            for (var group = 0; group < groupCount; group++)
            {
                itemInGroup[item, group] = model.NewBoolVar($"{itemLabel}{item}_group{group}");
            }
            model.AddExactlyOne(
                Enumerable.Range(0, groupCount).Select(group => itemInGroup[item, group]).ToArray()
            );
        }

        for (var group = 0; group < groupCount; group++)
        {
            var groupMembership = Enumerable
                .Range(0, itemCount)
                .Select(item => itemInGroup[item, group])
                .ToArray();
            model.Add(LinearExpr.Sum(groupMembership) == countsPerGroup[group]);
        }

        return itemInGroup;
    }

    private static IReadOnlyList<IReadOnlyList<int>> SelectedValueIndices(
        GroupFormationRequest request
    )
    {
        var valueIndexById = request
            .TopValues.Select((valueId, valueIndex) => (valueId, valueIndex))
            .ToDictionary(pair => pair.valueId, pair => pair.valueIndex);

        return request
            .Participants.Select(participant =>
                (IReadOnlyList<int>)
                    participant
                        .SelectedValues.Where(valueIndexById.ContainsKey)
                        .Select(selectedValue => valueIndexById[selectedValue])
                        .ToList()
            )
            .ToList();
    }

    private static void AddOverlapMaximization(
        CpModel model,
        IReadOnlyList<IReadOnlyList<int>> selectedValueIndices,
        BoolVar[,] participantInGroup,
        BoolVar[,] valueInGroup,
        IReadOnlyList<int> memberCounts,
        IReadOnlyList<int> valueCounts
    )
    {
        var overlapsPerValueInGroup = EmptyOverlapLists(
            valueInGroup.GetLength(0),
            memberCounts.Count
        );
        var allOverlaps = new List<BoolVar>();

        for (var participant = 0; participant < selectedValueIndices.Count; participant++)
        {
            allOverlaps.AddRange(
                AddParticipantOverlaps(
                    model,
                    participant,
                    selectedValueIndices[participant],
                    participantInGroup,
                    valueInGroup,
                    valueCounts,
                    overlapsPerValueInGroup
                )
            );
        }

        AddValueCapacityCuts(model, overlapsPerValueInGroup, valueInGroup, memberCounts);
        model.Maximize(LinearExpr.Sum(allOverlaps));
    }

    private static List<BoolVar>[,] EmptyOverlapLists(int valueCount, int groupCount)
    {
        var lists = new List<BoolVar>[valueCount, groupCount];
        for (var value = 0; value < valueCount; value++)
        {
            for (var group = 0; group < groupCount; group++)
            {
                lists[value, group] = [];
            }
        }

        return lists;
    }

    private static List<BoolVar> AddParticipantOverlaps(
        CpModel model,
        int participant,
        IReadOnlyList<int> selectedValues,
        BoolVar[,] participantInGroup,
        BoolVar[,] valueInGroup,
        IReadOnlyList<int> valueCounts,
        List<BoolVar>[,] overlapsPerValueInGroup
    )
    {
        var groupCount = valueCounts.Count;
        var overlaps = new List<BoolVar>();
        var overlapsPerGroup = new List<BoolVar>[groupCount];

        for (var group = 0; group < groupCount; group++)
        {
            overlapsPerGroup[group] = [];
        }

        foreach (var value in selectedValues)
        {
            for (var group = 0; group < groupCount; group++)
            {
                var overlap = model.NewBoolVar($"overlap_p{participant}_v{value}_g{group}");
                model.Add(overlap <= participantInGroup[participant, group]);
                model.Add(overlap <= valueInGroup[value, group]);
                overlaps.Add(overlap);
                overlapsPerGroup[group].Add(overlap);
                overlapsPerValueInGroup[value, group].Add(overlap);
            }
        }

        for (var group = 0; group < groupCount; group++)
        {
            var overlapCap = Math.Min(selectedValues.Count, valueCounts[group]);
            model.Add(
                LinearExpr.Sum(overlapsPerGroup[group].ToArray())
                    <= LinearExpr.Term(participantInGroup[participant, group], overlapCap)
            );
        }

        return overlaps;
    }

    private static void AddValueCapacityCuts(
        CpModel model,
        List<BoolVar>[,] overlapsPerValueInGroup,
        BoolVar[,] valueInGroup,
        IReadOnlyList<int> memberCounts
    )
    {
        for (var value = 0; value < valueInGroup.GetLength(0); value++)
        {
            for (var group = 0; group < memberCounts.Count; group++)
            {
                model.Add(
                    LinearExpr.Sum(overlapsPerValueInGroup[value, group].ToArray())
                        <= LinearExpr.Term(valueInGroup[value, group], memberCounts[group])
                );
            }
        }
    }

    private static GroupFormationResult ExtractGroups(
        CpSolver cpSolver,
        GroupFormationRequest request,
        BoolVar[,] participantInGroup,
        BoolVar[,] valueInGroup,
        int groupCount
    )
    {
        var groups = new List<FormedGroup>();

        for (var group = 0; group < groupCount; group++)
        {
            var members = request
                .Participants.Where(
                    (_, participant) =>
                        cpSolver.BooleanValue(participantInGroup[participant, group])
                )
                .Select(participant => participant.ParticipantId)
                .ToList();
            var assignedValues = request
                .TopValues.Where((_, value) => cpSolver.BooleanValue(valueInGroup[value, group]))
                .ToList();
            groups.Add(new FormedGroup(members, assignedValues));
        }

        return new GroupFormationResult(groups);
    }
}
