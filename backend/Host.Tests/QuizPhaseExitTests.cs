using Microsoft.Extensions.DependencyInjection;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Host.Tests;

public sealed class QuizPhaseExitTests : IClassFixture<WorkshopTestFactory>
{
    private readonly WorkshopTestFactory factory;

    public QuizPhaseExitTests(WorkshopTestFactory factory)
    {
        this.factory = factory;
    }

    [Fact]
    public void The_host_refuses_to_leave_the_quiz_before_it_is_complete()
    {
        var session = SessionInQuizPhase(QuizProgress.Restore(0, false, false, []));

        Should.Throw<WrongPhaseException>(() =>
            session.AdvancePhase(
                TestSessions.CallerOf(session),
                RegisteredExitGuards(),
                new TestGroupSolver(),
                new TestAnimalNames(8)
            )
        );

        session.PhaseProgress.CurrentPhase.ShouldBe(Phase.Quiz);
    }

    [Fact]
    public void The_host_lets_the_quiz_be_left_once_the_last_learning_text_was_shown()
    {
        var session = SessionInQuizPhase(QuizProgress.Restore(4, true, true, []));

        session.AdvancePhase(
            TestSessions.CallerOf(session),
            RegisteredExitGuards(),
            new TestGroupSolver(),
            new TestAnimalNames(8)
        );

        session.PhaseProgress.CurrentPhase.ShouldBe(Phase.ValueSelection);
    }

    private PhaseExitGuards RegisteredExitGuards()
    {
        return factory.Services.GetRequiredService<PhaseExitGuards>();
    }

    private static Session SessionInQuizPhase(QuizProgress quiz)
    {
        return TestSessions.InPhase(new SessionIdentity(Guid.NewGuid()), Phase.Quiz, quiz);
    }
}
