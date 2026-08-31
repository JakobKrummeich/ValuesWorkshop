using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;
using ValuesWorkshop.Application.State;

namespace ValuesWorkshop.Adapters.Tests;

// WHY: a corpus is only as good as what it happens to contain, and sample-luck
// rots quietly — a variant nobody sampled is a variant nobody checks. These
// tests hold the fixtures against the wire types' own list of variants, so
// adding a phase or a sub-state without a sample fails here.
// Plan: docs/architecture/reviews/2026-08-30-wire-contract-fitness-function.md (step 7).
public sealed class WireVariantCoverageTests
{
    private static readonly Dictionary<string, IReadOnlySet<string>> WireValuesOfRole =
        WireRoles.All.ToDictionary(role => role, WireValuesIn);

    public static TheoryData<string, string, string> PolymorphicVariants
    {
        get
        {
            var variants = new TheoryData<string, string, string>();
            foreach (var (role, property, value) in DeclaredVariants())
            {
                variants.Add(role, property, value);
            }

            return variants;
        }
    }

    [Theory]
    [MemberData(nameof(PolymorphicVariants))]
    public void Every_polymorphic_variant_has_a_sample(string role, string property, string value)
    {
        WireValuesOfRole[role]
            .ShouldContain(
                WireValue(property, value),
                $"No {role} fixture carries {property}={value}. Add a scenario to WireStateFixtures."
            );
    }

    [Theory]
    [InlineData("participant", "workStatus", "\"editing\"")]
    [InlineData("participant", "workStatus", "\"submitted\"")]
    [InlineData("participant", "isRoundOpen", "true")]
    [InlineData("participant", "isRoundOpen", "false")]
    [InlineData("participant", "ownGroup", "null")]
    [InlineData("participant", "isConcluded", "true")]
    [InlineData("participant", "isConcluded", "false")]
    [InlineData("facilitator", "isConcluded", "true")]
    [InlineData("facilitator", "isConcluded", "false")]
    [InlineData("presenter", "isConcluded", "true")]
    [InlineData("presenter", "isConcluded", "false")]
    [InlineData("facilitator", "workStatus", "\"editing\"")]
    [InlineData("facilitator", "workStatus", "\"submitted\"")]
    [InlineData("facilitator", "isRoundOpen", "true")]
    [InlineData("facilitator", "isRoundOpen", "false")]
    [InlineData("presenter", "isRoundOpen", "true")]
    [InlineData("presenter", "isRoundOpen", "false")]
    public void Every_state_a_screen_renders_differently_has_a_sample(
        string role,
        string property,
        string value
    )
    {
        WireValuesOfRole[role]
            .ShouldContain(
                WireValue(property, value),
                $"No {role} fixture carries {property}={value}. Add a scenario to WireStateFixtures."
            );
    }

    private static IEnumerable<(string Role, string Property, string Value)> DeclaredVariants()
    {
        var wireTypes = typeof(ParticipantWorkshopState).Assembly.GetTypes();

        foreach (var wireType in wireTypes)
        {
            var polymorphic = wireType.GetCustomAttribute<JsonPolymorphicAttribute>();
            var role = WireRoles.All.FirstOrDefault(candidate =>
                wireType.Name.StartsWith(candidate, StringComparison.OrdinalIgnoreCase)
            );

            if (polymorphic?.TypeDiscriminatorPropertyName is not { } property || role is null)
            {
                continue;
            }

            foreach (var derived in wireType.GetCustomAttributes<JsonDerivedTypeAttribute>())
            {
                yield return (role, property, JsonSerializer.Serialize(derived.TypeDiscriminator));
            }
        }
    }

    private static IReadOnlySet<string> WireValuesIn(string role)
    {
        var values = new HashSet<string>(StringComparer.Ordinal);
        foreach (var fixture in WireContract.CheckedInFilesIn("state", role))
        {
            using var document = JsonDocument.Parse(
                File.ReadAllText(WireContract.PathOf("state", role, fixture))
            );
            Collect(document.RootElement, values);
        }

        return values;
    }

    private static void Collect(JsonElement element, HashSet<string> values)
    {
        foreach (var property in Properties(element))
        {
            if (IsScalar(property.Value))
            {
                values.Add(WireValue(property.Name, property.Value.GetRawText()));
            }

            Collect(property.Value, values);
        }

        foreach (var item in Items(element))
        {
            Collect(item, values);
        }
    }

    // WHY: only scalars ever name a variant, and keeping whole objects out of the
    // set keeps a failure message readable instead of a page of nested JSON.
    private static bool IsScalar(JsonElement element)
    {
        return element.ValueKind is not (JsonValueKind.Object or JsonValueKind.Array);
    }

    private static IEnumerable<JsonProperty> Properties(JsonElement element)
    {
        return element.ValueKind == JsonValueKind.Object ? element.EnumerateObject() : [];
    }

    private static IEnumerable<JsonElement> Items(JsonElement element)
    {
        return element.ValueKind == JsonValueKind.Array ? element.EnumerateArray() : [];
    }

    private static string WireValue(string property, string value)
    {
        return $"{property}={value}";
    }
}
