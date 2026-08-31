using System.Reflection;
using System.Text.Json;
using ValuesWorkshop.Adapters.Web;
using ValuesWorkshop.Application.Intents;

namespace ValuesWorkshop.Adapters.Tests;

// WHY: intent names cross the wire as strings — the frontend sends
// invoke("AddAction", valueId) and SignalR dispatches by name — so no compiler on
// either side sees a mismatch; PR #42 needed three hand repairs for exactly that
// (a8e3540 "Fix port signatures to match backend hub methods"). This test produces
// contract/intents.json, the machine-checked shadow of design/protocol.md § 4 that
// the frontend suite reads: a hub rename breaks the build through nameof, a new or
// renamed parameter fails the assertions below, and the regenerated file is what
// carries the change to the other side of the seam.
// Plan: docs/architecture/reviews/2026-08-30-wire-contract-fitness-function.md (step 1).
public sealed class WireContractTests
{
    private static readonly IntentCatalog Catalog = new(
        nameof(IParticipantClient.ReceiveWorkshopState),
        new SortedDictionary<string, string[]>(StringComparer.Ordinal)
        {
            [nameof(FacilitatorHub.AdvancePhase)] = [],
            [nameof(FacilitatorHub.CloseVoting)] = [],
            [nameof(FacilitatorHub.CorrectActionWording)] = ["actionId", "text"],
            [nameof(FacilitatorHub.GoToNextValue)] = [],
            [nameof(FacilitatorHub.PoseNextQuestion)] = [],
            [nameof(FacilitatorHub.ReassignScribe)] = ["participantId"],
            [nameof(FacilitatorHub.RevealAnswer)] = [],
            [nameof(FacilitatorHub.RevealNextValue)] = [],
            [nameof(FacilitatorHub.ShowLearningText)] = [],
            [nameof(FacilitatorHub.StartTiebreakRound)] = [],
        },
        new SortedDictionary<string, string[]>(StringComparer.Ordinal)
        {
            [nameof(ParticipantHub.AddAction)] = ["valueId"],
            [nameof(ParticipantHub.ChooseQuizAnswer)] = ["questionIndex", "answerIndex"],
            [nameof(ParticipantHub.EditAction)] = ["actionId", "text"],
            [nameof(ParticipantHub.RemoveAction)] = ["actionId"],
            [nameof(ParticipantHub.ReopenGroupWork)] = [],
            [nameof(ParticipantHub.SubmitFinalVotes)] = ["votes"],
            [nameof(ParticipantHub.SubmitGroupWork)] = ["values"],
            [nameof(ParticipantHub.SubmitValueSelection)] = ["valueIds"],
        }
    );

    [Fact]
    public void The_checked_in_intent_catalog_matches_the_hubs()
    {
        WireContract.ShouldMatchCheckedInFile(
            JsonSerializer.Serialize(Catalog, WireContract.Json),
            "intents.json"
        );
    }

    [Fact]
    public void Every_intent_the_hubs_declare_is_listed_in_the_catalog()
    {
        DeclaredIntentsOf(typeof(FacilitatorHub))
            .ShouldBe(SignaturesOf(Catalog.Facilitator), ignoreOrder: true);
        DeclaredIntentsOf(typeof(ParticipantHub))
            .ShouldBe(SignaturesOf(Catalog.Participant), ignoreOrder: true);
        DeclaredIntentsOf(typeof(PresenterHub)).ShouldBeEmpty();
    }

    [Fact]
    public void Every_role_receives_its_state_through_the_same_callback_name()
    {
        Catalog.StateCallback.ShouldBe(nameof(IFacilitatorClient.ReceiveWorkshopState));
        Catalog.StateCallback.ShouldBe(nameof(IPresenterClient.ReceiveWorkshopState));
    }

    private static IReadOnlyList<string> SignaturesOf(IReadOnlyDictionary<string, string[]> intents)
    {
        return [.. intents.Select(intent => Signature(intent.Key, intent.Value))];
    }

    private static IReadOnlyList<string> DeclaredIntentsOf(Type hub)
    {
        return
        [
            .. hub.GetMethods(
                    BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly
                )
                .Where(method => method.ReturnType == typeof(Task<IntentResult>))
                .Select(method =>
                    Signature(
                        method.Name,
                        [.. method.GetParameters().Select(parameter => parameter.Name ?? "?")]
                    )
                ),
        ];
    }

    private static string Signature(string name, IReadOnlyList<string> parameters)
    {
        return $"{name}({string.Join(", ", parameters)})";
    }

    private sealed record IntentCatalog(
        string StateCallback,
        IReadOnlyDictionary<string, string[]> Facilitator,
        IReadOnlyDictionary<string, string[]> Participant
    );
}
