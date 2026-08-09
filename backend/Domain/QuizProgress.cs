namespace ValuesWorkshop.Domain;

public sealed class QuizProgress
{
    public int? CurrentQuestionIndex { get; private set; }
    public bool IsRevealed { get; private set; }
    public bool IsLearningTextShown { get; private set; }

    public bool IsQuizComplete(int questionCount)
    {
        return CurrentQuestionIndex >= questionCount - 1 && IsRevealed && IsLearningTextShown;
    }

    internal void PoseFirstQuestion()
    {
        CurrentQuestionIndex = 0;
        IsRevealed = false;
        IsLearningTextShown = false;
    }

    internal void RevealAnswer()
    {
        if (CurrentQuestionIndex is null)
        {
            throw new WrongPhaseException("No quiz question is posed.");
        }

        if (IsRevealed)
        {
            throw new WrongPhaseException(
                "The answer of the current question is already revealed."
            );
        }

        IsRevealed = true;
    }

    internal void ShowLearningText()
    {
        if (!IsRevealed)
        {
            throw new WrongPhaseException(
                "The learning text is shown once the answer is revealed."
            );
        }

        if (IsLearningTextShown)
        {
            throw new WrongPhaseException(
                "The learning text of the current question is already shown."
            );
        }

        IsLearningTextShown = true;
    }

    internal void PoseNextQuestion(int questionCount)
    {
        if (!IsLearningTextShown)
        {
            throw new WrongPhaseException(
                "The next question is posed once the learning text is shown."
            );
        }

        if (CurrentQuestionIndex >= questionCount - 1)
        {
            throw new WrongPhaseException("No quiz question remains.");
        }

        CurrentQuestionIndex++;
        IsRevealed = false;
        IsLearningTextShown = false;
    }

    internal static QuizProgress Restore(
        int? currentQuestionIndex,
        bool isRevealed,
        bool isLearningTextShown
    )
    {
        return new QuizProgress
        {
            CurrentQuestionIndex = currentQuestionIndex,
            IsRevealed = isRevealed,
            IsLearningTextShown = isLearningTextShown,
        };
    }
}
