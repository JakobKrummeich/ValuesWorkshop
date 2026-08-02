namespace ValuesWorkshop.Domain;

public sealed record QuizExitGuard(int QuizQuestionCount) : PhaseExitGuard(Phase.Quiz)
{
    public override string Refusal =>
        "The quiz is left once the last question's learning text has been shown.";

    public override bool IsSatisfiedBy(Session session)
    {
        return session.Quiz.IsQuizComplete(QuizQuestionCount);
    }
}
