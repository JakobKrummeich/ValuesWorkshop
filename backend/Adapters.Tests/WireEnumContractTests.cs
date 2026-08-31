using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;
using ValuesWorkshop.Application.Intents;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Tests;

// WHY: every wire enum is declared twice — once in C#, once in TypeScript — and
// the two only agree by hand. The values differ per enum (Phase travels as a
// number, GroupWorkStatus as "editing"), so a mirror written from the C# source
// alone can be wrong even when it looks right. contract/enums.json records what
// the serializer emits; frontend/src/domain/__tests__/wireEnums.test.ts holds
// the TypeScript enums against it.
// Plan: docs/architecture/reviews/2026-08-30-wire-contract-fitness-function.md (steps 3-4).
public sealed class WireEnumContractTests
{
    private static readonly Dictionary<string, IReadOnlyDictionary<string, JsonElement>> Catalog =
        new()
        {
            [nameof(Phase)] = WireFormsOf<Phase>(),
            [nameof(IntentRejectionCode)] = WireFormsOf<IntentRejectionCode>(),
            [nameof(FacilitatorIntent)] = WireFormsOf<FacilitatorIntent>(),
            [nameof(QuizSubState)] = WireFormsOf<QuizSubState>(),
            [nameof(GroupWorkStatus)] = WireFormsOf<GroupWorkStatus>(),
            [nameof(FormationSubState)] = WireFormsOfConstants(typeof(FormationSubState)),
        };

    [Fact]
    public void The_checked_in_enum_catalog_matches_the_serializer()
    {
        WireContract.ShouldMatchCheckedInFile(
            JsonSerializer.Serialize(Catalog, WireContract.Json),
            "enums.json"
        );
    }

    [Fact]
    public void Every_enum_the_wire_types_expose_is_listed_in_the_catalog()
    {
        EnumsReachableFromWireTypes().ShouldBeSubsetOf(Catalog.Keys);
    }

    private static IReadOnlyDictionary<string, JsonElement> WireFormsOf<TEnum>()
        where TEnum : struct, Enum
    {
        return Enum.GetValues<TEnum>()
            .ToDictionary(member => member.ToString(), member => WireContract.WireFormOf(member));
    }

    // WHY: the formation sub-state is a static class of string constants, not an
    // enum — it exists only as a JsonPolymorphic discriminator — but the frontend
    // mirrors it as an enum, so the corpus carries it alongside the real ones.
    private static IReadOnlyDictionary<string, JsonElement> WireFormsOfConstants(Type constants)
    {
        return constants
            .GetFields(BindingFlags.Public | BindingFlags.Static)
            .ToDictionary(
                field => field.Name,
                field => WireContract.WireFormOf(field.GetValue(null)!)
            );
    }

    private static IReadOnlyList<string> EnumsReachableFromWireTypes()
    {
        Type[] roots =
        [
            typeof(ParticipantWorkshopState),
            typeof(FacilitatorWorkshopState),
            typeof(PresenterWorkshopState),
            typeof(IntentResult),
        ];

        var found = new SortedSet<string>(StringComparer.Ordinal);
        var visited = new HashSet<Type>();
        foreach (var root in roots)
        {
            CollectEnums(root, found, visited);
        }

        return [.. found];
    }

    private static void CollectEnums(Type type, SortedSet<string> found, HashSet<Type> visited)
    {
        var underlying = Nullable.GetUnderlyingType(type) ?? type;
        if (!visited.Add(underlying))
        {
            return;
        }

        if (underlying.IsEnum)
        {
            found.Add(underlying.Name);
            return;
        }

        foreach (var related in WireTypesRelatedTo(underlying))
        {
            CollectEnums(related, found, visited);
        }
    }

    private static IReadOnlyList<Type> WireTypesRelatedTo(Type type)
    {
        var elements = type.GetGenericArguments();
        if (type.Namespace?.StartsWith("ValuesWorkshop", StringComparison.Ordinal) != true)
        {
            return elements;
        }

        return
        [
            .. elements,
            .. type.GetCustomAttributes<JsonDerivedTypeAttribute>()
                .Select(derived => derived.DerivedType),
            .. type.GetProperties(BindingFlags.Public | BindingFlags.Instance)
                .Select(property => property.PropertyType),
        ];
    }
}
