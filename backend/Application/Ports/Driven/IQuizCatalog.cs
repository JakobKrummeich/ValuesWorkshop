namespace ValuesWorkshop.Application.Ports.Driven;

public interface IQuizCatalog
{
    IReadOnlyList<QuizQuestion> Questions { get; }
}
