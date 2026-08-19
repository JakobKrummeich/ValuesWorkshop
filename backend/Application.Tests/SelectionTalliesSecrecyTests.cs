using System.Text.Json;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Tests;

public class SelectionTalliesSecrecyTests
{
    private static readonly JsonSerializerOptions WireOptions = new(JsonSerializerDefaults.Web);

    private static readonly TestQuizCatalog QuizCatalog = new(5);

    private static readonly TestValuesCatalog ValuesCatalog = new(50);

    private static readonly TestAnimalsCatalog AnimalsCatalog = new(8);

    [Fact]
    public void Participant_json_carries_no_tallies_and_no_top_values_during_the_selection_phase()
    {
        var json = JsonSerializer.Serialize(
            new ParticipantWorkshopStateMapper(QuizCatalog, ValuesCatalog, AnimalsCatalog).MapFor(
                SelectionPhaseSession(),
                SessionFixtures.Anna,
                1
            ),
            WireOptions
        );

        json.ShouldContain("\"values\"");
        json.ShouldNotContain("selectionTallies");
        json.ShouldNotContain("topValueIds");
    }

    [Fact]
    public void Facilitator_json_carries_no_tallies_and_no_top_values_during_the_selection_phase()
    {
        var json = JsonSerializer.Serialize(
            new FacilitatorWorkshopStateMapper(
                QuizCatalog,
                ValuesCatalog,
                AnimalsCatalog,
                RegisteredExitGuards.For(QuizCatalog)
            ).Map(SelectionPhaseSession(), 1),
            WireOptions
        );

        json.ShouldContain("\"values\"");
        json.ShouldNotContain("selectionTallies");
        json.ShouldNotContain("topValueIds");
    }

    [Fact]
    public void Presenter_json_carries_no_tallies_and_no_top_values_during_the_selection_phase()
    {
        var json = JsonSerializer.Serialize(
            new PresenterWorkshopStateMapper(QuizCatalog, ValuesCatalog, AnimalsCatalog).Map(
                SelectionPhaseSession(),
                1
            ),
            WireOptions
        );

        json.ShouldContain("\"values\"");
        json.ShouldNotContain("selectionTallies");
        json.ShouldNotContain("topValueIds");
    }

    [Fact]
    public void Participant_json_carries_tallies_and_top_values_in_the_results_phase()
    {
        var json = JsonSerializer.Serialize(
            new ParticipantWorkshopStateMapper(QuizCatalog, ValuesCatalog, AnimalsCatalog).MapFor(
                SessionFixtures.InSelectionResults(),
                SessionFixtures.Anna,
                1
            ),
            WireOptions
        );

        json.ShouldContain("selectionTallies");
        json.ShouldContain("topValueIds");
    }

    [Fact]
    public void Facilitator_json_carries_tallies_and_top_values_in_the_results_phase()
    {
        var json = JsonSerializer.Serialize(
            new FacilitatorWorkshopStateMapper(
                QuizCatalog,
                ValuesCatalog,
                AnimalsCatalog,
                RegisteredExitGuards.For(QuizCatalog)
            ).Map(SessionFixtures.InSelectionResults(), 1),
            WireOptions
        );

        json.ShouldContain("selectionTallies");
        json.ShouldContain("topValueIds");
    }

    [Fact]
    public void Presenter_json_carries_tallies_and_top_values_in_the_results_phase()
    {
        var json = JsonSerializer.Serialize(
            new PresenterWorkshopStateMapper(QuizCatalog, ValuesCatalog, AnimalsCatalog).Map(
                SessionFixtures.InSelectionResults(),
                1
            ),
            WireOptions
        );

        json.ShouldContain("selectionTallies");
        json.ShouldContain("topValueIds");
    }

    [Fact]
    public void Participant_results_json_keeps_empty_tallies_and_top_values_when_nobody_submitted()
    {
        var json = JsonSerializer.Serialize(
            new ParticipantWorkshopStateMapper(QuizCatalog, ValuesCatalog, AnimalsCatalog).MapFor(
                SessionFixtures.InPhase(Phase.SelectionResults),
                SessionFixtures.Anna,
                1
            ),
            WireOptions
        );

        json.ShouldContain("\"selectionTallies\":{}");
        json.ShouldContain("\"topValueIds\":[]");
    }

    [Fact]
    public void Facilitator_results_json_keeps_empty_tallies_and_top_values_when_nobody_submitted()
    {
        var json = JsonSerializer.Serialize(
            new FacilitatorWorkshopStateMapper(
                QuizCatalog,
                ValuesCatalog,
                AnimalsCatalog,
                RegisteredExitGuards.For(QuizCatalog)
            ).Map(SessionFixtures.InPhase(Phase.SelectionResults), 1),
            WireOptions
        );

        json.ShouldContain("\"selectionTallies\":{}");
        json.ShouldContain("\"topValueIds\":[]");
    }

    private static Session SelectionPhaseSession()
    {
        return SessionFixtures.InPhase(
            Phase.ValueSelection,
            selection: SelectionRound.Restore(
                [
                    new SelectedValue(SessionFixtures.Anna, new ValueId("wert-1")),
                    new SelectedValue(SessionFixtures.Ben, new ValueId("wert-1")),
                ],
                []
            )
        );
    }
}
