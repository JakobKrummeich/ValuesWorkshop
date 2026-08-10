using System.Text.Json;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Tests;

public class SelectionTalliesSecrecyTests
{
    private static readonly JsonSerializerOptions WireOptions = new(JsonSerializerDefaults.Web);

    private static readonly TestQuizCatalog QuizCatalog = new(5);

    private static readonly TestValuesCatalog ValuesCatalog = new(50);

    [Fact]
    public void Participant_json_carries_no_tallies_and_no_top_values_during_the_selection_phase()
    {
        var json = JsonSerializer.Serialize(
            new ParticipantWorkshopStateMapper(QuizCatalog, ValuesCatalog).MapFor(
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
            new PresenterWorkshopStateMapper(QuizCatalog, ValuesCatalog).Map(
                SelectionPhaseSession(),
                1
            ),
            WireOptions
        );

        json.ShouldContain("\"values\"");
        json.ShouldNotContain("selectionTallies");
        json.ShouldNotContain("topValueIds");
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
