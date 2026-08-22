using System.Text.Json;
using ValuesWorkshop.Application;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Tests;

public class QuizCorrectAnswerSecrecyTests
{
    private static readonly JsonSerializerOptions WireOptions = new(JsonSerializerDefaults.Web);

    private static readonly TestQuizCatalog Catalog = new(5);

    private static readonly TestValuesCatalog ValuesCatalog = new(50);

    private static readonly TestAnimalsCatalog AnimalsCatalog = new(8);

    [Theory]
    [InlineData(false, false)]
    [InlineData(true, false)]
    [InlineData(true, true)]
    public void Participant_json_never_mentions_the_correct_answer_or_the_learning_text(
        bool isRevealed,
        bool isLearningTextShown
    )
    {
        var session = SessionFixtures.InPhase(
            Phase.Quiz,
            quiz: QuizProgress.Restore(0, isRevealed, isLearningTextShown, [])
        );

        var json = ParticipantJsonOf(session);

        json.ShouldNotContain("correctAnswerIndex");
        json.ShouldNotContain("learningText");
    }

    [Fact]
    public void Presenter_json_never_mentions_the_correct_answer_before_the_reveal()
    {
        var session = SessionFixtures.InPhase(
            Phase.Quiz,
            quiz: QuizProgress.Restore(0, false, false, [])
        );

        PresenterJsonOf(session).ShouldNotContain("correctAnswerIndex");
    }

    [Fact]
    public void Presenter_json_never_mentions_the_learning_text_before_it_is_shown()
    {
        var session = SessionFixtures.InPhase(
            Phase.Quiz,
            quiz: QuizProgress.Restore(0, true, false, [])
        );

        PresenterJsonOf(session).ShouldNotContain("learningText");
    }

    [Fact]
    public void Once_shown_presenter_json_carries_the_learning_text()
    {
        var session = SessionFixtures.InPhase(
            Phase.Quiz,
            quiz: QuizProgress.Restore(0, true, true, [])
        );

        PresenterJsonOf(session).ShouldContain("\"learningText\"");
    }

    [Fact]
    public void Once_revealed_presenter_json_carries_the_correct_answer()
    {
        var session = SessionFixtures.InPhase(
            Phase.Quiz,
            quiz: QuizProgress.Restore(0, true, false, [])
        );

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
            new FacilitatorWorkshopStateMapper(Catalog, ValuesCatalog, AnimalsCatalog).Map(
                session,
                1
            ),
            WireOptions
        );

        json.ShouldContain("\"correctAnswerIndex\":1");
        json.ShouldContain("\"learningText\"");
    }

    private static string ParticipantJsonOf(Session session)
    {
        return JsonSerializer.Serialize(
            new ParticipantWorkshopStateMapper(Catalog, ValuesCatalog, AnimalsCatalog).MapFor(
                session,
                SessionFixtures.Anna,
                1
            ),
            WireOptions
        );
    }

    private static string PresenterJsonOf(Session session)
    {
        return JsonSerializer.Serialize(
            new PresenterWorkshopStateMapper(Catalog, ValuesCatalog, AnimalsCatalog).Map(
                session,
                1
            ),
            WireOptions
        );
    }
}
