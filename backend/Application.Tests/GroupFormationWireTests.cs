using System.Text.Json;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Tests;

public class GroupFormationWireTests
{
    private static readonly JsonSerializerOptions WireOptions = new(JsonSerializerDefaults.Web);

    private static readonly TestQuizCatalog QuizCatalog = new(5);

    private static readonly TestValuesCatalog ValuesCatalog = new(50);

    private static readonly TestAnimalsCatalog AnimalsCatalog = new(8);

    [Fact]
    public void Participant_json_carries_the_own_group_with_localized_texts()
    {
        var json = ParticipantJson(FormedSession());

        json.ShouldContain(
            "\"ownGroup\":{\"name\":{\"animalId\":\"tier-1\",\"text\":{\"de\":\"Tier 1\",\"en\":\"Animal 1\"}}"
        );
        json.ShouldContain("\"memberDisplayNames\":[\"Ben\",\"Anna Schmidt\"]");
        json.ShouldContain(
            "\"assignedValues\":[{\"valueId\":\"wert-1\",\"text\":{\"de\":\"Wert 1\",\"en\":\"Value 1\"}}]"
        );
    }

    [Fact]
    public void Facilitator_json_carries_every_group_with_member_identifiers()
    {
        var json = FacilitatorJson(FormedSession());

        json.ShouldContain("\"groups\":[{\"name\":{\"animalId\":\"tier-1\"");
        json.ShouldContain(
            "\"members\":[{\"participantId\":\"00000000-0000-0000-0000-0000000000b2\",\"displayName\":\"Ben\"}"
        );
        json.ShouldContain("\"animalId\":\"tier-2\"");
        json.ShouldContain("\"assignedValues\":[{\"valueId\":\"wert-1\"");
    }

    [Fact]
    public void Presenter_json_names_group_members_without_identifiers()
    {
        var json = PresenterJson(FormedSession());

        json.ShouldContain("\"groups\":[{\"name\":{\"animalId\":\"tier-1\"");
        json.ShouldContain("\"memberDisplayNames\":[\"Ben\",\"Anna Schmidt\"]");
        json.ShouldNotContain("participantId");
    }

    [Fact]
    public void No_role_json_carries_scribes_work_status_or_actions_in_the_formation_phase()
    {
        foreach (
            var json in new[]
            {
                ParticipantJson(FormedSession()),
                FacilitatorJson(FormedSession()),
                PresenterJson(FormedSession()),
            }
        )
        {
            json.ShouldNotContain("scribe");
            json.ShouldNotContain("Scribe");
            json.ShouldNotContain("workStatus");
            json.ShouldNotContain("actions");
        }
    }

    [Fact]
    public void Formation_that_has_not_run_serializes_empty_groups_and_no_own_group()
    {
        var session = SessionFixtures.InPhase(Phase.GroupFormation);

        ParticipantJson(session).ShouldContain("\"ownGroup\":null");
        FacilitatorJson(session).ShouldContain("\"groups\":[]");
        PresenterJson(session).ShouldContain("\"groups\":[]");
    }

    private static Session FormedSession()
    {
        return SessionFixtures.InPhase(
            Phase.GroupFormation,
            formation: SessionFixtures.TwoGroups()
        );
    }

    private static string ParticipantJson(Session session)
    {
        return JsonSerializer.Serialize(
            new ParticipantWorkshopStateMapper(QuizCatalog, ValuesCatalog, AnimalsCatalog).MapFor(
                session,
                SessionFixtures.Anna,
                1
            ),
            WireOptions
        );
    }

    private static string FacilitatorJson(Session session)
    {
        return JsonSerializer.Serialize(
            new FacilitatorWorkshopStateMapper(QuizCatalog, ValuesCatalog, AnimalsCatalog).Map(
                session,
                1
            ),
            WireOptions
        );
    }

    private static string PresenterJson(Session session)
    {
        return JsonSerializer.Serialize(
            new PresenterWorkshopStateMapper(QuizCatalog, ValuesCatalog, AnimalsCatalog).Map(
                session,
                1
            ),
            WireOptions
        );
    }
}
