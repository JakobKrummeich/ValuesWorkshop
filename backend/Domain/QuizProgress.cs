namespace ValuesWorkshop.Domain;

public sealed class QuizProgress
{
    public const int QuestionCount = 5;
    public const int AnswersPerQuestion = 3;

    private readonly List<CastAnswer> castAnswers = [];

    public int? CurrentQuestionIndex { get; private set; }
    public bool IsRevealed { get; private set; }
    public bool IsLearningTextShown { get; private set; }
    public IReadOnlyList<CastAnswer> CastAnswers => castAnswers;

    public IReadOnlyList<int> AnswerTallies
    {
        get
        {
            var tallies = new int[AnswersPerQuestion];

            foreach (var cast in castAnswers)
            {
                if (cast.QuestionIndex == CurrentQuestionIndex)
                {
                    tallies[cast.AnswerIndex]++;
                }
            }

            return tallies;
        }
    }

    public int? AnswerIndexOf(ParticipantId participantId)
    {
        return castAnswers
            .SingleOrDefault(cast =>
                cast.QuestionIndex == CurrentQuestionIndex && cast.ParticipantId == participantId
            )
            ?.AnswerIndex;
    }

    public int AnsweredCount =>
        castAnswers.Count(cast => cast.QuestionIndex == CurrentQuestionIndex);

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

        IsLearningTextShown = true;
    }

    internal void ChooseAnswer(ParticipantId participantId, int questionIndex, int answerIndex)
    {
        if (CurrentQuestionIndex != questionIndex || IsRevealed)
        {
            throw new WrongPhaseException(
                "An answer is cast on the current question while it is unrevealed."
            );
        }

        if (answerIndex is < 0 or >= AnswersPerQuestion)
        {
            throw new MalformedPayloadException(
                $"The answer index must lie between 0 and {AnswersPerQuestion - 1}."
            );
        }

        if (
            castAnswers.Any(cast =>
                cast.QuestionIndex == questionIndex && cast.ParticipantId == participantId
            )
        )
        {
            throw new InvariantViolationException(
                "Each participant answers each quiz question exactly once."
            );
        }

        castAnswers.Add(new CastAnswer(questionIndex, participantId, answerIndex));
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
        bool isLearningTextShown,
        IEnumerable<CastAnswer> castAnswers
    )
    {
        var progress = new QuizProgress
        {
            CurrentQuestionIndex = currentQuestionIndex,
            IsRevealed = isRevealed,
            IsLearningTextShown = isLearningTextShown,
        };
        progress.castAnswers.AddRange(castAnswers);

        return progress;
    }
}
