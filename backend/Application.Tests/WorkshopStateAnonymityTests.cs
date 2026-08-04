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
    ];

    [Fact]
    public void Participant_state_identifies_nobody_but_the_caller_themselves()
    {
        ParticipantIdentifyingPathsOf(typeof(ParticipantWorkshopState))
            .ShouldBe(["ParticipantJoinState.OwnDisplayName"], ignoreOrder: false);
    }

    [Fact]
    public void Presenter_state_identifies_participants_only_in_the_join_lobby()
    {
        ParticipantIdentifyingPathsOf(typeof(PresenterWorkshopState))
            .ShouldBe(["PresenterJoinState.ParticipantDisplayNames[]"], ignoreOrder: false);
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
                    "FacilitatorGroupFormationState.Groups[].MemberParticipantIds[]",
                    "FacilitatorGroupFormationState.Groups[].ScribeParticipantId",
                    "FacilitatorGroupFormationState.Roster.Participants[].DisplayName",
                    "FacilitatorGroupFormationState.Roster.Participants[].ParticipantId",
                    "FacilitatorGroupWorkState.Groups[].MemberParticipantIds[]",
                    "FacilitatorGroupWorkState.Groups[].ScribeParticipantId",
                    "FacilitatorGroupWorkState.Roster.Participants[].DisplayName",
                    "FacilitatorGroupWorkState.Roster.Participants[].ParticipantId",
                    "FacilitatorJoinState.Roster.Participants[].DisplayName",
                    "FacilitatorJoinState.Roster.Participants[].ParticipantId",
                    "FacilitatorQuizState.Roster.Participants[].DisplayName",
                    "FacilitatorQuizState.Roster.Participants[].ParticipantId",
                    "FacilitatorSelectionResultsState.Roster.Participants[].DisplayName",
                    "FacilitatorSelectionResultsState.Roster.Participants[].ParticipantId",
                    "FacilitatorValuePresentationState.Groups[].MemberParticipantIds[]",
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
        var variants = stateType
            .GetCustomAttributes<JsonDerivedTypeAttribute>()
            .Select(attribute => attribute.DerivedType)
            .ToList();

        variants.ShouldNotBeEmpty();

        var paths = new List<string>();
        foreach (var variant in variants)
        {
            CollectIdentifyingPaths(variant, variant.Name, paths);
        }

        return paths.Distinct(StringComparer.Ordinal).Order(StringComparer.Ordinal).ToList();
    }

    private static void CollectIdentifyingPaths(Type type, string prefix, List<string> paths)
    {
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
            return (type.GetGenericArguments().Single(), "[]");
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
