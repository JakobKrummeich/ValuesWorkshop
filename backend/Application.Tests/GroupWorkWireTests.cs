using System.Text.Json;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Tests;

public class GroupWorkWireTests
{
    private static readonly JsonSerializerOptions WireOptions = new(JsonSerializerDefaults.Web);

    private static readonly TestQuizCatalog QuizCatalog = new(5);

    private static readonly TestValuesCatalog ValuesCatalog = new(50);

    private static readonly TestAnimalsCatalog AnimalsCatalog = new(8);

    [Fact]
    public void Participant_json_carries_the_scribe_the_work_status_and_the_actions()
    {
        var json = ParticipantJson(GroupWorkSession());

        json.ShouldContain("\"isCallerScribe\":true");
        json.ShouldContain("\"scribeName\":\"Anna Schmidt\"");
        json.ShouldContain("\"workStatus\":\"editing\"");
        json.ShouldContain(
            "\"actions\":[{\"actionId\":\"00000000-0000-0000-0000-00000000ac01\",\"valueId\":\"wert-1\",\"text\":\"Talk\",\"sortOrder\":0}]"
        );
    }

    [Fact]
    public void Facilitator_json_carries_scribe_identifiers_work_status_and_action_counts()
    {
        var json = FacilitatorJson(GroupWorkSession());

        json.ShouldContain("\"scribeParticipantId\":\"00000000-0000-0000-0000-0000000000a1\"");
        json.ShouldContain("\"workStatus\":\"editing\"");
        json.ShouldContain("\"workStatus\":\"submitted\"");
        json.ShouldContain("\"actionCountPerValue\":{\"wert-1\":1}");
        json.ShouldContain("\"actionCountPerValue\":{\"wert-2\":0}");
    }

    [Fact]
    public void Presenter_json_carries_the_work_status_and_nothing_else_of_the_group_work()
    {
        var json = PresenterJson(GroupWorkSession());

        json.ShouldContain("\"workStatus\":\"editing\"");
        json.ShouldContain("\"workStatus\":\"submitted\"");
        json.ShouldNotContain("scribe");
        json.ShouldNotContain("actions");
        json.ShouldNotContain("participantId");
    }

    [Fact]
    public void After_group_work_no_role_carries_group_work_data_anymore()
    {
        var session = SessionFixtures.InPhase(
            Phase.ValuePresentation,
            formation: SessionFixtures.TwoGroups(
                new GroupAction(
                    new ActionId(Guid.Parse("00000000-0000-0000-0000-00000000ac01")),
                    new ValueId("wert-1"),
                    GroupActionText.Of("Talk")
                )
            ),
            presentation: PresentationWalk.Restore("tier-1", new ValueId("wert-1"), 1)
        );

        foreach (
            var json in new[]
            {
                ParticipantJson(session),
                FacilitatorJson(session),
                PresenterJson(session),
            }
        )
        {
            json.ShouldNotContain("workStatus");
            json.ShouldNotContain("scribe");
            json.ShouldNotContain("isCallerScribe");
            json.ShouldNotContain("actionCountPerValue");
            json.ShouldNotContain("\"actions\"");
        }
    }

    private static Session GroupWorkSession()
    {
        return SessionFixtures.InPhase(
            Phase.GroupWork,
            formation: SessionFixtures.TwoGroups(
                new GroupAction(
                    new ActionId(Guid.Parse("00000000-0000-0000-0000-00000000ac01")),
                    new ValueId("wert-1"),
                    GroupActionText.Of("Talk")
                )
            )
        );
    }

    private static string ParticipantJson(Session session)
    {
        return JsonSerializer.Serialize(
            new ParticipantWorkshopStateMapper(
                QuizCatalog,
                ValuesCatalog,
                AnimalsCatalog,
                new TestFormationProgress(0)
            ).MapFor(session, SessionFixtures.Anna, 1),
            WireOptions
        );
    }

    private static string FacilitatorJson(Session session)
    {
        return JsonSerializer.Serialize(
            new FacilitatorWorkshopStateMapper(
                QuizCatalog,
                ValuesCatalog,
                AnimalsCatalog,
                new TestFormationProgress(0)
            ).Map(session, 1),
            WireOptions
        );
    }

    private static string PresenterJson(Session session)
    {
        return JsonSerializer.Serialize(
            new PresenterWorkshopStateMapper(
                QuizCatalog,
                ValuesCatalog,
                AnimalsCatalog,
                new TestFormationProgress(0)
            ).Map(session, 1),
            WireOptions
        );
    }
}
