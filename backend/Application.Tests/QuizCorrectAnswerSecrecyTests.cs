using System.Text.Json;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Tests;

public class QuizCorrectAnswerSecrecyTests
{
    private static readonly JsonSerializerOptions WireOptions = new(JsonSerializerDefaults.Web);

    private static readonly TestQuizCatalog Catalog = new(5);

    [Fact]
    public void Participant_and_presenter_json_never_mention_the_correct_answer_before_the_reveal()
    {
        var session = SessionFixtures.InPhase(
            Phase.Quiz,
            quiz: QuizProgress.Restore(0, false, false, [])
        );

        ParticipantJsonOf(session).ShouldNotContain("correctAnswerIndex");
        PresenterJsonOf(session).ShouldNotContain("correctAnswerIndex");
    }

    [Fact]
    public void Participant_and_presenter_json_never_mention_the_learning_text_before_it_is_shown()
    {
        var session = SessionFixtures.InPhase(
            Phase.Quiz,
            quiz: QuizProgress.Restore(0, true, false, [])
        );

        ParticipantJsonOf(session).ShouldNotContain("learningText");
        PresenterJsonOf(session).ShouldNotContain("learningText");
    }

    [Fact]
    public void Once_shown_participant_and_presenter_json_carry_the_learning_text()
    {
        var session = SessionFixtures.InPhase(
            Phase.Quiz,
            quiz: QuizProgress.Restore(0, true, true, [])
        );

        ParticipantJsonOf(session).ShouldContain("\"learningText\"");
        PresenterJsonOf(session).ShouldContain("\"learningText\"");
    }

    [Fact]
    public void Once_revealed_participant_and_presenter_json_carry_the_correct_answer()
    {
        var session = SessionFixtures.InPhase(
            Phase.Quiz,
            quiz: QuizProgress.Restore(0, true, false, [])
        );

        ParticipantJsonOf(session).ShouldContain("\"correctAnswerIndex\":1");
        PresenterJsonOf(session).ShouldContain("\"correctAnswerIndex\":1");
    }

    [Fact]
    public void Facilitator_json_carries_the_correct_answer_even_before_the_reveal()
    {
        var session = SessionFixtures.InPhase(
            Phase.Quiz,
            quiz: QuizProgress.Restore(0, false, false, [])
        );

        var json = JsonSerializer.Serialize(
            new FacilitatorWorkshopStateMapper(Catalog).Map(session, 1),
            WireOptions
        );

        json.ShouldContain("\"correctAnswerIndex\":1");
        json.ShouldContain("\"learningText\"");
    }

    private static string ParticipantJsonOf(Session session)
    {
        return JsonSerializer.Serialize(
            new ParticipantWorkshopStateMapper(Catalog).MapFor(session, SessionFixtures.Anna, 1),
            WireOptions
        );
    }

    private static string PresenterJsonOf(Session session)
    {
        return JsonSerializer.Serialize(
            new PresenterWorkshopStateMapper(Catalog).Map(session, 1),
            WireOptions
        );
    }
}
