using System.Collections;
using System.Reflection;
using System.Text.Json.Serialization;
using ValuesWorkshop.Application.State;

namespace ValuesWorkshop.Application.Tests;

public class WorkshopStateAnonymityTests
{
    private static readonly string[] IdentifyingNameSuffixes =
    [
        "DisplayName",
        "DisplayNames",
        "ParticipantName",
        "ScribeName",
    ];

    [Fact]
    public void Participant_state_identifies_nobody_but_the_caller_themselves()
    {
        ParticipantIdentifyingPathsOf(typeof(ParticipantWorkshopState))
            .ShouldBe(
                [
                    "ParticipantGroupFormationState.Formation.OwnGroup.Actions[].ActionId",
                    "ParticipantGroupFormationState.Formation.OwnGroup.MemberDisplayNames[]",
                    "ParticipantGroupFormationState.Formation.OwnGroup.ScribeName",
                    "ParticipantGroupWorkState.OwnGroup.Actions[].ActionId",
                    "ParticipantGroupWorkState.OwnGroup.MemberDisplayNames[]",
                    "ParticipantGroupWorkState.OwnGroup.ScribeName",
                    "ParticipantJoinState.OwnDisplayName",
                    "ParticipantValuePresentationState.OwnGroup.Actions[].ActionId",
                    "ParticipantValuePresentationState.OwnGroup.MemberDisplayNames[]",
                    "ParticipantValuePresentationState.OwnGroup.ScribeName",
                ],
                ignoreOrder: false
            );
    }

    [Fact]
    public void Presenter_state_identifies_participants_only_in_the_join_lobby()
    {
        ParticipantIdentifyingPathsOf(typeof(PresenterWorkshopState))
            .ShouldBe(
                [
                    "PresenterGroupFormationState.Formation.Groups[].MemberDisplayNames[]",
                    "PresenterGroupWorkState.Groups[].MemberDisplayNames[]",
                    "PresenterJoinState.ParticipantDisplayNames[]",
                    "PresenterValuePresentationState.Groups[].MemberDisplayNames[]",
                ],
                ignoreOrder: false
            );
    }

    [Fact]
    public void Facilitator_state_identifies_participants_only_where_the_screens_need_it()
    {
        ParticipantIdentifyingPathsOf(typeof(FacilitatorWorkshopState))
            .ShouldBe(
                [
                    "FacilitatorFinalPresentationState.Roster.Participants[].DisplayName",
                    "FacilitatorFinalPresentationState.Roster.Participants[].ParticipantId",
                    "FacilitatorFinalVotingState.Roster.Participants[].DisplayName",
                    "FacilitatorFinalVotingState.Roster.Participants[].ParticipantId",
                    "FacilitatorGroupFormationState.Formation.Groups[].Members[].DisplayName",
                    "FacilitatorGroupFormationState.Formation.Groups[].Members[].ParticipantId",
                    "FacilitatorGroupFormationState.Formation.Groups[].ScribeParticipantId",
                    "FacilitatorGroupFormationState.Roster.Participants[].DisplayName",
                    "FacilitatorGroupFormationState.Roster.Participants[].ParticipantId",
                    "FacilitatorGroupWorkState.Groups[].Members[].DisplayName",
                    "FacilitatorGroupWorkState.Groups[].Members[].ParticipantId",
                    "FacilitatorGroupWorkState.Groups[].ScribeParticipantId",
                    "FacilitatorGroupWorkState.Roster.Participants[].DisplayName",
                    "FacilitatorGroupWorkState.Roster.Participants[].ParticipantId",
                    "FacilitatorJoinState.Roster.Participants[].DisplayName",
                    "FacilitatorJoinState.Roster.Participants[].ParticipantId",
                    "FacilitatorQuizState.Roster.Participants[].DisplayName",
                    "FacilitatorQuizState.Roster.Participants[].ParticipantId",
                    "FacilitatorSelectionResultsState.Roster.Participants[].DisplayName",
                    "FacilitatorSelectionResultsState.Roster.Participants[].ParticipantId",
                    "FacilitatorValuePresentationState.Groups[].Members[].DisplayName",
                    "FacilitatorValuePresentationState.Groups[].Members[].ParticipantId",
                    "FacilitatorValuePresentationState.Groups[].ScribeParticipantId",
                    "FacilitatorValuePresentationState.Roster.Participants[].DisplayName",
                    "FacilitatorValuePresentationState.Roster.Participants[].ParticipantId",
                    "FacilitatorValueSelectionState.Roster.Participants[].DisplayName",
                    "FacilitatorValueSelectionState.Roster.Participants[].ParticipantId",
                ],
                ignoreOrder: false
            );
    }

    private static IReadOnlyList<string> ParticipantIdentifyingPathsOf(Type stateType)
    {
        var variants = VariantsOf(stateType);

        variants.ShouldNotBeEmpty();

        var paths = new List<string>();
        foreach (var variant in variants)
        {
            CollectIdentifyingPaths(variant, variant.Name, paths);
        }

        return paths.Distinct(StringComparer.Ordinal).Order(StringComparer.Ordinal).ToList();
    }

    private static IReadOnlyList<Type> VariantsOf(Type type)
    {
        return type.GetCustomAttributes<JsonDerivedTypeAttribute>()
            .Select(attribute => attribute.DerivedType)
            .ToList();
    }

    private static void CollectIdentifyingPaths(Type type, string prefix, List<string> paths)
    {
        foreach (var variant in VariantsOf(type))
        {
            CollectIdentifyingPaths(variant, prefix, paths);
        }

        foreach (var property in type.GetProperties(BindingFlags.Public | BindingFlags.Instance))
        {
            var (propertyType, suffix) = Unwrap(property.PropertyType);
            var path = prefix.Length == 0 ? property.Name : $"{prefix}.{property.Name}";

            if (propertyType == typeof(Guid) || IsDisplayName(propertyType, property.Name))
            {
                paths.Add(path + suffix);
            }
            else if (IsWireState(propertyType))
            {
                CollectIdentifyingPaths(propertyType, path + suffix, paths);
            }
        }
    }

    private static (Type Type, string Suffix) Unwrap(Type type)
    {
        var underlying = Nullable.GetUnderlyingType(type);
        if (underlying is not null)
        {
            return (underlying, string.Empty);
        }

        if (type != typeof(string) && typeof(IEnumerable).IsAssignableFrom(type))
        {
            var genericArguments = type.GetGenericArguments();

            return (
                genericArguments.FirstOrDefault(argument => argument == typeof(Guid))
                    ?? genericArguments[^1],
                "[]"
            );
        }

        return (type, string.Empty);
    }

    private static bool IsWireState(Type type)
    {
        return type.Namespace == typeof(ParticipantWorkshopState).Namespace;
    }

    private static bool IsDisplayName(Type propertyType, string propertyName)
    {
        return propertyType == typeof(string)
            && IdentifyingNameSuffixes.Any(suffix =>
                propertyName.EndsWith(suffix, StringComparison.Ordinal)
            );
    }
}
