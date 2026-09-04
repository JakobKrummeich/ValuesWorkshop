using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Host.Tests;

public class CpSatGroupSolverProperties
{
    private const int LargestWorkshop = 30;
    private const int MostTopValues = 12;

    private static readonly Arbitrary<GroupFormationRequest> FormationRequests = Arb.From(
        WorkshopGenerators
            .CountBetween(0, LargestWorkshop)
            .Generator.SelectMany(participantCount =>
                WorkshopGenerators
                    .CountBetween(0, MostTopValues)
                    .Generator.SelectMany(topValueCount =>
                        RequestOf(participantCount, topValueCount)
                    )
            ),
        SmallerRequests
    );

    private readonly CpSatGroupSolver solver = new();

    [Property(MaxTest = 15)]
    public Property Every_participant_lands_in_exactly_one_group_and_no_group_is_left_empty()
    {
        return Prop.ForAll(
            FormationRequests,
            request =>
            {
                var groups = solver.Solve(request, CancellationToken.None).Groups;

                groups
                    .SelectMany(group => group.Members)
                    .ShouldBe(
                        request.Participants.Select(participant => participant.ParticipantId),
                        ignoreOrder: true
                    );
                groups
                    .Select(group => group.Members.Count)
                    .ShouldBe(GroupSizing.ParticipantCountsPerGroup(request.Participants.Count));
                groups.ShouldAllBe(group =>
                    group.Members.Count >= 1 || request.Participants.Count == 0
                );
            }
        );
    }

    [Property(MaxTest = 15)]
    public Property Every_top_value_is_dealt_to_exactly_one_group()
    {
        return Prop.ForAll(
            FormationRequests,
            request =>
            {
                var groups = solver.Solve(request, CancellationToken.None).Groups;

                groups
                    .SelectMany(group => group.AssignedValues)
                    .ShouldBe(request.TopValues, ignoreOrder: true);
                groups
                    .Select(group => group.AssignedValues.Count)
                    .ShouldBe(
                        GroupSizing.ValueCountsPerGroup(request.TopValues.Count, groups.Count)
                    );
            }
        );
    }

    [Property(MaxTest = 8)]
    public Property The_same_request_forms_the_same_groups_every_time()
    {
        return Prop.ForAll(
            FormationRequests,
            request =>
                ShouldFormTheSameGroups(
                    solver.Solve(request, CancellationToken.None),
                    solver.Solve(request, CancellationToken.None)
                )
        );
    }

    [Property(MaxTest = 8)]
    public Property Selections_outside_the_top_values_never_change_the_groups()
    {
        return Prop.ForAll(
            FormationRequests,
            request =>
                ShouldFormTheSameGroups(
                    solver.Solve(request, CancellationToken.None),
                    solver.Solve(WithSelectionsBeyondTheTopValues(request), CancellationToken.None)
                )
        );
    }

    private static void ShouldFormTheSameGroups(
        GroupFormationResult expected,
        GroupFormationResult actual
    )
    {
        actual.Groups.Count.ShouldBe(expected.Groups.Count);

        foreach (var (expectedGroup, actualGroup) in expected.Groups.Zip(actual.Groups))
        {
            actualGroup.Members.ShouldBe(expectedGroup.Members);
            actualGroup.AssignedValues.ShouldBe(expectedGroup.AssignedValues);
        }
    }

    private static GroupFormationRequest WithSelectionsBeyondTheTopValues(
        GroupFormationRequest request
    )
    {
        var beyondTheTopValues = TestValueIds.Numbered(MostTopValues + 1, 3);

        return request with
        {
            Participants =
            [
                .. request.Participants.Select(participant =>
                    participant with
                    {
                        SelectedValues = [.. participant.SelectedValues, .. beyondTheTopValues],
                    }
                ),
            ],
        };
    }

    private static Gen<GroupFormationRequest> RequestOf(int participantCount, int topValueCount)
    {
        var topValues = TestValueIds.Numbered(1, topValueCount);

        return Gen.CollectToList(
                Enumerable.Range(1, participantCount),
                participantNumber => SelectionOf(participantNumber, topValues)
            )
            .Select(participants => new GroupFormationRequest(participants, topValues));
    }

    private static Gen<ParticipantSelection> SelectionOf(
        int participantNumber,
        IReadOnlyList<ValueId> topValues
    )
    {
        return WorkshopGenerators
            .CountBetween(0, Math.Min(topValues.Count, SelectionRound.ValuesPerSelection))
            .Generator.SelectMany(selectionSize =>
                WorkshopGenerators.DistinctValuesFrom(topValues, selectionSize)
            )
            .Select(selectedValues => new ParticipantSelection(
                WorkshopGenerators.ParticipantNumbered(participantNumber),
                selectedValues
            ));
    }

    private static IEnumerable<GroupFormationRequest> SmallerRequests(GroupFormationRequest request)
    {
        return WorkshopGenerators
            .ListsWithOneItemDropped(request.Participants)
            .Select(participants => request with { Participants = participants })
            .Concat(
                WorkshopGenerators
                    .ListsWithOneItemDropped(request.TopValues)
                    .Select(topValues => request with { TopValues = topValues })
            );
    }
}
