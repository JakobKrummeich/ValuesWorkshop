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
            .ShouldBe(["OwnDisplayName"], ignoreOrder: false);
    }

    [Fact]
    public void Presenter_state_identifies_participants_only_in_the_join_lobby()
    {
        ParticipantIdentifyingPathsOf(typeof(PresenterWorkshopState))
            .ShouldBe(["ParticipantDisplayNames[]"], ignoreOrder: false);
    }

    [Fact]
    public void Facilitator_state_identifies_participants_only_where_the_screens_need_it()
    {
        ParticipantIdentifyingPathsOf(typeof(FacilitatorWorkshopState))
            .ShouldBe(
                [
                    "Groups[].MemberParticipantIds[]",
                    "Groups[].ScribeParticipantId",
                    "Roster.Participants[].DisplayName",
                    "Roster.Participants[].ParticipantId",
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
            CollectIdentifyingPaths(variant, prefix: string.Empty, paths);
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
