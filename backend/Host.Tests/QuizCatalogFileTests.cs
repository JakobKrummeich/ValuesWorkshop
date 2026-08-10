using ValuesWorkshop.Application.Ports.Driven;

namespace ValuesWorkshop.Host.Tests;

public sealed class QuizCatalogFileTests : IDisposable
{
    private readonly List<string> temporaryFiles = [];

    [Fact]
    public void The_shipped_quiz_content_has_five_questions()
    {
        var catalog = ShippedCatalog();

        catalog.Questions.Count.ShouldBe(5);
    }

    [Fact]
    public void Every_shipped_question_has_three_answers_with_exactly_one_correct()
    {
        var catalog = ShippedCatalog();

        foreach (var question in catalog.Questions)
        {
            question.Answers.Count.ShouldBe(3);
            question.Answers.Count(answer => answer.Kind == QuizAnswerKind.Correct).ShouldBe(1);
            question.CorrectAnswerIndex.ShouldBeInRange(0, 2);
        }
    }

    [Fact]
    public void Every_shipped_text_is_present_in_both_locales()
    {
        var catalog = ShippedCatalog();

        foreach (var question in catalog.Questions)
        {
            ShouldBeBilingual(question.Question);
            ShouldBeBilingual(question.LearningText);

            foreach (var answer in question.Answers)
            {
                ShouldBeBilingual(answer.Text);
            }
        }
    }

    [Fact]
    public void A_missing_file_refuses_to_load()
    {
        var exception = Should.Throw<InvalidOperationException>(() =>
            QuizCatalogFile.LoadFrom(Path.Combine(Path.GetTempPath(), "no-such-quiz.json"))
        );

        exception.Message.ShouldContain("does not exist");
    }

    [Fact]
    public void A_file_that_is_not_json_refuses_to_load()
    {
        var path = TemporaryFile("this is not json");

        var exception = Should.Throw<InvalidOperationException>(() =>
            QuizCatalogFile.LoadFrom(path)
        );

        exception.Message.ShouldContain("not valid JSON");
    }

    [Fact]
    public void A_file_without_questions_refuses_to_load()
    {
        var path = TemporaryFile("""{ "questions": [] }""");

        var exception = Should.Throw<InvalidOperationException>(() =>
            QuizCatalogFile.LoadFrom(path)
        );

        exception.Message.ShouldContain("no questions");
    }

    [Fact]
    public void A_question_with_two_correct_answers_refuses_to_load()
    {
        var path = TemporaryFile(
            QuestionDocument(answerKinds: ["correct", "correct", "funnyWrong"])
        );

        var exception = Should.Throw<InvalidOperationException>(() =>
            QuizCatalogFile.LoadFrom(path)
        );

        exception.Message.ShouldContain("exactly one correct answer");
    }

    [Fact]
    public void A_question_with_two_answers_refuses_to_load()
    {
        var path = TemporaryFile(QuestionDocument(answerKinds: ["correct", "wrong"]));

        var exception = Should.Throw<InvalidOperationException>(() =>
            QuizCatalogFile.LoadFrom(path)
        );

        exception.Message.ShouldContain("exactly 3 answers");
    }

    [Fact]
    public void An_answer_with_an_unknown_kind_refuses_to_load()
    {
        var path = TemporaryFile(QuestionDocument(answerKinds: ["correct", "wrong", "hilarious"]));

        var exception = Should.Throw<InvalidOperationException>(() =>
            QuizCatalogFile.LoadFrom(path)
        );

        exception.Message.ShouldContain("unknown answer kind 'hilarious'");
    }

    [Fact]
    public void A_question_with_an_empty_locale_refuses_to_load()
    {
        var path = TemporaryFile(
            QuestionDocument(answerKinds: ["correct", "wrong", "funnyWrong"], englishQuestion: " ")
        );

        var exception = Should.Throw<InvalidOperationException>(() =>
            QuizCatalogFile.LoadFrom(path)
        );

        exception.Message.ShouldContain("both locales");
    }

    public void Dispose()
    {
        foreach (var path in temporaryFiles)
        {
            File.Delete(path);
        }
    }

    private static QuizCatalogFile ShippedCatalog()
    {
        return QuizCatalogFile.LoadFrom(Path.Combine("config", "quiz.json"));
    }

    private static void ShouldBeBilingual(LocalizedText text)
    {
        text.German.ShouldNotBeNullOrWhiteSpace();
        text.English.ShouldNotBeNullOrWhiteSpace();
    }

    private static string QuestionDocument(string[] answerKinds, string englishQuestion = "Why?")
    {
        var answers = string.Join(
            ",",
            answerKinds.Select(
                (kind, index) =>
                    $$"""
                        {
                          "id": "a{{index}}",
                          "kind": "{{kind}}",
                          "text": { "de": "Antwort {{index}}", "en": "Answer {{index}}" }
                        }
                        """
            )
        );

        return $$"""
            {
              "questions": [
                {
                  "id": "q1",
                  "question": { "de": "Warum?", "en": "{{englishQuestion}}" },
                  "answers": [{{answers}}],
                  "learningText": { "de": "Weil.", "en": "Because." }
                }
              ]
            }
            """;
    }

    private string TemporaryFile(string content)
    {
        var path = Path.Combine(Path.GetTempPath(), $"quiz-test-{Guid.NewGuid()}.json");
        File.WriteAllText(path, content);
        temporaryFiles.Add(path);

        return path;
    }
}
