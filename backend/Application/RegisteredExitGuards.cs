using ValuesWorkshop.Application.Ports.Driven;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application;

public static class RegisteredExitGuards
{
    public static PhaseExitGuards For(IQuizCatalog quizCatalog)
    {
        return new PhaseExitGuards(
            new QuizExitGuard(quizCatalog.Questions.Count),
            new GroupWorkExitGuard(),
            new FinalVotingExitGuard()
        );
    }
}
