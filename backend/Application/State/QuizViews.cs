using ValuesWorkshop.Application.Ports.Driven;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

internal static class QuizViews
{
    internal static ParticipantQuizView ForParticipant(
        Session session,
        ParticipantId caller,
        IQuizCatalog quizCatalog
    )
    {
        var quiz = session.Quiz;
        var questionIndex = PosedQuestionIndexOf(quiz);
        var question = quizCatalog.Questions[questionIndex];

        return new ParticipantQuizView(
            questionIndex,
            quizCatalog.Questions.Count,
            SubStateOf(quiz),
            ViewOf(question.Question),
            AnswerViewsOf(question),
            quiz.AnswerIndexOf(caller)
        );
    }

    internal static FacilitatorQuizView ForFacilitator(Session session, IQuizCatalog quizCatalog)
    {
        var quiz = session.Quiz;
        var questionIndex = PosedQuestionIndexOf(quiz);
        var question = quizCatalog.Questions[questionIndex];

        return new FacilitatorQuizView(
            questionIndex,
            quizCatalog.Questions.Count,
            SubStateOf(quiz),
            ViewOf(question.Question),
            AnswerViewsOf(question),
            quiz.AnswerTallies,
            quiz.AnsweredCount,
            question.CorrectAnswerIndex,
            ViewOf(question.LearningText)
        );
    }

    internal static PresenterQuizView ForPresenter(Session session, IQuizCatalog quizCatalog)
    {
        var quiz = session.Quiz;
        var questionIndex = PosedQuestionIndexOf(quiz);
        var question = quizCatalog.Questions[questionIndex];

        return new PresenterQuizView(
            questionIndex,
            quizCatalog.Questions.Count,
            SubStateOf(quiz),
            ViewOf(question.Question),
            AnswerViewsOf(question),
            quiz.AnswerTallies,
            quiz.IsRevealed ? question.CorrectAnswerIndex : null,
            quiz.IsLearningTextShown ? ViewOf(question.LearningText) : null
        );
    }

    private static int PosedQuestionIndexOf(QuizProgress quiz)
    {
        return quiz.CurrentQuestionIndex
            ?? throw new InvalidOperationException("The quiz phase always has a posed question.");
    }

    private static QuizSubState SubStateOf(QuizProgress quiz)
    {
        if (quiz.IsLearningTextShown)
        {
            return QuizSubState.LearningTextShown;
        }

        return quiz.IsRevealed ? QuizSubState.Revealed : QuizSubState.Answering;
    }

    private static IReadOnlyList<LocalizedTextView> AnswerViewsOf(QuizQuestion question)
    {
        return question.Answers.Select(answer => ViewOf(answer.Text)).ToList();
    }

    private static LocalizedTextView ViewOf(LocalizedText text)
    {
        return new LocalizedTextView(text.German, text.English);
    }
}
