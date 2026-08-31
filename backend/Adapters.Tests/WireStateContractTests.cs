using System.Text.Json;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Tests;

// WHY: a state block whose shape drifts is dropped by the frontend without a
// word — createSessionStatePort logs to the console and keeps the last state
// that parsed, which in a live workshop is a frozen wall. These fixtures are the
// backend's serialized truth for every role and phase;
// frontend/src/domain/__tests__/wireContract.test.ts parses them with the zod
// schemas, so a renamed or retyped field fails on both sides of the seam.
// Plan: docs/architecture/reviews/2026-08-30-wire-contract-fitness-function.md (steps 5-7).
public sealed class WireStateContractTests
{
    private const string StateDirectory = "state";

    private static readonly TestQuizCatalog QuizCatalog = new(QuizProgress.QuestionCount);
    private static readonly TestValuesCatalog ValuesCatalog = new(50);
    private static readonly TestAnimalsCatalog AnimalsCatalog = new(8);
    private static readonly TestFormationProgress FormationProgress = new(0.25);

    private static readonly FacilitatorWorkshopStateMapper FacilitatorStateMapper = new(
        QuizCatalog,
        ValuesCatalog,
        AnimalsCatalog,
        FormationProgress
    );
    private static readonly ParticipantWorkshopStateMapper ParticipantStateMapper = new(
        QuizCatalog,
        ValuesCatalog,
        AnimalsCatalog,
        FormationProgress
    );
    private static readonly PresenterWorkshopStateMapper PresenterStateMapper = new(
        QuizCatalog,
        ValuesCatalog,
        AnimalsCatalog,
        FormationProgress
    );

    public static TheoryData<string> ScenarioNames =>
        [.. WireStateFixtures.All.Select(scenario => scenario.Name)];

    [Theory]
    [MemberData(nameof(ScenarioNames))]
    public void The_checked_in_state_corpus_matches_the_mappers(string scenarioName)
    {
        var scenario = WireStateFixtures.All.Single(candidate => candidate.Name == scenarioName);

        foreach (var (role, state) in StatesOf(scenario))
        {
            WireContract.ShouldMatchCheckedInFile(
                JsonSerializer.Serialize(WireContract.WireFormOf(state), WireContract.Json),
                StateDirectory,
                role,
                $"{scenarioName}.json"
            );
        }
    }

    [Fact]
    public void The_state_corpus_holds_nothing_but_the_fixtures()
    {
        var expected = WireStateFixtures
            .All.SelectMany(scenario =>
                StatesOf(scenario).Select(state => $"{state.Role}/{scenario.Name}.json")
            )
            .Order(StringComparer.Ordinal);

        WireContract.CheckedInFilesIn(StateDirectory).ShouldBe(expected);
    }

    private static readonly Dictionary<string, Func<WireStateScenario, object>> StateMapperOfRole =
        new()
        {
            [WireRoles.Participant] = scenario =>
                ParticipantStateMapper.MapFor(
                    scenario.Session,
                    scenario.Caller,
                    scenario.Session.Revision
                ),
            [WireRoles.Facilitator] = scenario =>
                FacilitatorStateMapper.Map(scenario.Session, scenario.Session.Revision),
            [WireRoles.Presenter] = scenario =>
                PresenterStateMapper.Map(scenario.Session, scenario.Session.Revision),
        };

    private static IReadOnlyList<(string Role, object State)> StatesOf(WireStateScenario scenario)
    {
        return [.. scenario.RolesCovered.Select(role => (role, StateMapperOfRole[role](scenario)))];
    }
}
