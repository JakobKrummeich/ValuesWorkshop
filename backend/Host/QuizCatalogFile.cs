using System.Text.Json;
using ValuesWorkshop.Application.Ports.Driven;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Host;

public sealed class QuizCatalogFile : IQuizCatalog
{
    private const int AnswersPerQuestion = QuizProgress.AnswersPerQuestion;

    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public IReadOnlyList<QuizQuestion> Questions { get; }

    private QuizCatalogFile(IReadOnlyList<QuizQuestion> questions)
    {
        Questions = questions;
    }

    public static QuizCatalogFile LoadFrom(string path)
    {
        if (!File.Exists(path))
        {
            throw new InvalidOperationException($"Quiz content file '{path}' does not exist.");
        }

        FileDocument? document;
        try
        {
            document = JsonSerializer.Deserialize<FileDocument>(
                File.ReadAllText(path),
                SerializerOptions
            );
        }
        catch (JsonException exception)
        {
            throw new InvalidOperationException(
                $"Quiz content file '{path}' is not valid JSON.",
                exception
            );
        }

        if (document?.Questions is not { Count: > 0 } fileQuestions)
        {
            throw new InvalidOperationException(
                $"Quiz content file '{path}' contains no questions."
            );
        }

        return new QuizCatalogFile(
            fileQuestions
                .Select((fileQuestion, questionIndex) => ToQuestion(fileQuestion, questionIndex))
                .ToList()
        );
    }

    private static QuizQuestion ToQuestion(FileQuestion fileQuestion, int questionIndex)
    {
        var label = $"question {questionIndex} ('{fileQuestion.Id}')";

        if (fileQuestion.Answers is not { Count: AnswersPerQuestion } fileAnswers)
        {
            throw new InvalidOperationException(
                $"Quiz content: {label} needs exactly {AnswersPerQuestion} answers."
            );
        }

        var answers = fileAnswers
            .Select(fileAnswer => new QuizAnswer(
                KindOf(fileAnswer.Kind, label),
                TextOf(fileAnswer.Text, $"{label}, answer '{fileAnswer.Id}'")
            ))
            .ToList();

        if (answers.Count(answer => answer.Kind == QuizAnswerKind.Correct) != 1)
        {
            throw new InvalidOperationException(
                $"Quiz content: {label} needs exactly one correct answer."
            );
        }

        return new QuizQuestion(
            TextOf(fileQuestion.Question, label),
            answers,
            TextOf(fileQuestion.LearningText, $"{label}, learning text")
        );
    }

    private static QuizAnswerKind KindOf(string? kind, string label)
    {
        return kind switch
        {
            "correct" => QuizAnswerKind.Correct,
            "wrong" => QuizAnswerKind.Wrong,
            "funnyWrong" => QuizAnswerKind.FunnyWrong,
            _ => throw new InvalidOperationException(
                $"Quiz content: {label} has an unknown answer kind '{kind}'."
            ),
        };
    }

    private static LocalizedText TextOf(FileText? text, string label)
    {
        if (
            text is null
            || string.IsNullOrWhiteSpace(text.De)
            || string.IsNullOrWhiteSpace(text.En)
        )
        {
            throw new InvalidOperationException(
                $"Quiz content: {label} needs non-empty text in both locales."
            );
        }

        return new LocalizedText(text.De, text.En);
    }

    private sealed record FileDocument(List<FileQuestion>? Questions);

    private sealed record FileQuestion(
        string? Id,
        FileText? Question,
        List<FileAnswer>? Answers,
        FileText? LearningText
    );

    private sealed record FileAnswer(string? Id, string? Kind, FileText? Text);

    private sealed record FileText(string? De, string? En);
}
