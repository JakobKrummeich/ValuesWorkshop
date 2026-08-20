namespace ValuesWorkshop.Domain;

public sealed record QuizExitGuard : IPhaseExitGuard
{
    public Phase Phase => Phase.Quiz;

    public string Refusal =>
        "The quiz is left once the last question's learning text has been shown.";

    public bool IsSatisfiedBy(Session session)
    {
        return session.Quiz.IsQuizComplete;
    }
}
