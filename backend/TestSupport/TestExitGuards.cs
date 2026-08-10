using ValuesWorkshop.Application.Ports.Driven;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.TestSupport;

public static class TestExitGuards
{
    public static PhaseExitGuards RegisteredFor(IQuizCatalog quizCatalog)
    {
        return new PhaseExitGuards(
            new QuizExitGuard(quizCatalog.Questions.Count),
            new GroupWorkExitGuard(),
            new FinalVotingExitGuard()
        );
    }
}
