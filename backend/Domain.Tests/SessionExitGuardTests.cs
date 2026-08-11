namespace ValuesWorkshop.Domain.Tests;

public class SessionExitGuardTests
{
    private static readonly PhaseExitGuards AllGuards = new(
        new QuizExitGuard(QuizQuestionCount: 5),
        new GroupWorkExitGuard(),
        new ValuePresentationExitGuard(PresentedValueCount: 3),
        new FinalVotingExitGuard()
    );

    private static readonly PhaseExitGuards GuardsWithoutAuthoredContent = new(
        new GroupWorkExitGuard(),
        new FinalVotingExitGuard()
    );

    private static readonly ParticipantId Anna = new(
        Guid.Parse("00000000-0000-0000-0000-0000000000a1")
    );

    [Fact]
    public void The_quiz_may_not_be_left_before_the_last_question_is_walked()
    {
        var session = SessionInPhase(Phase.Quiz, quiz: QuizProgress.Restore(3, true, true, []));

        ShouldRefuseToAdvance(session, Phase.Quiz);
    }

    [Fact]
    public void The_quiz_may_not_be_left_while_the_last_learning_text_is_unshown()
    {
        var session = SessionInPhase(Phase.Quiz, quiz: QuizProgress.Restore(4, true, false, []));

        ShouldRefuseToAdvance(session, Phase.Quiz);
    }

    [Fact]
    public void The_quiz_may_be_left_once_the_last_question_index_is_walked()
    {
        var session = SessionInPhase(Phase.Quiz, quiz: QuizProgress.Restore(4, true, true, []));

        Advance(session);

        session.PhaseProgress.CurrentPhase.ShouldBe(Phase.ValueSelection);
    }

    [Fact]
    public void A_phase_without_a_registered_guard_is_left_freely()
    {
        var session = SessionInPhase(
            Phase.Quiz,
            quiz: QuizProgress.Restore(null, false, false, [])
        );

        Advance(session, PhaseExitGuards.None);

        session.PhaseProgress.CurrentPhase.ShouldBe(Phase.ValueSelection);
    }

    [Fact]
    public void Group_work_may_not_be_left_while_a_group_is_still_editing()
    {
        var session = SessionInPhase(
            Phase.GroupWork,
            formation: FormationOf(submittedStates: [true, false])
        );

        ShouldRefuseToAdvance(session, Phase.GroupWork);
    }

    [Fact]
    public void Group_work_may_be_left_while_no_group_has_been_formed()
    {
        var session = SessionInPhase(Phase.GroupWork, formation: FormationOf([]));

        Advance(session);

        session.PhaseProgress.CurrentPhase.ShouldBe(Phase.ValuePresentation);
    }

    [Fact]
    public void Group_work_may_be_left_once_every_group_has_submitted()
    {
        var session = SessionInPhase(
            Phase.GroupWork,
            formation: FormationOf(submittedStates: [true, true])
        );

        Advance(session);

        session.PhaseProgress.CurrentPhase.ShouldBe(Phase.ValuePresentation);
    }

    [Fact]
    public void Value_presentation_may_not_be_left_before_every_value_is_shown()
    {
        var session = SessionInPhase(
            Phase.ValuePresentation,
            presentation: PresentationWalk.Restore("Otter", new ValueId("honesty"), 2)
        );

        ShouldRefuseToAdvance(session, Phase.ValuePresentation);
    }

    [Fact]
    public void Value_presentation_may_be_left_once_every_value_is_shown()
    {
        var session = SessionInPhase(
            Phase.ValuePresentation,
            presentation: PresentationWalk.Restore("Otter", new ValueId("courage"), 3)
        );

        Advance(session);

        session.PhaseProgress.CurrentPhase.ShouldBe(Phase.FinalVoting);
    }

    [Fact]
    public void Value_presentation_is_left_freely_while_its_content_is_not_authored_yet()
    {
        var session = SessionInPhase(
            Phase.ValuePresentation,
            presentation: PresentationWalk.Restore(null, null, 0)
        );

        Advance(session, GuardsWithoutAuthoredContent);

        session.PhaseProgress.CurrentPhase.ShouldBe(Phase.FinalVoting);
    }

    [Fact]
    public void Final_voting_may_not_be_left_before_five_winners_stand()
    {
        var session = SessionInPhase(
            Phase.FinalVoting,
            voting: VotingRounds.Restore(false, 1, Winners(4))
        );

        ShouldRefuseToAdvance(session, Phase.FinalVoting);
    }

    [Fact]
    public void Final_voting_may_be_left_once_five_winners_stand()
    {
        var session = SessionInPhase(
            Phase.FinalVoting,
            voting: VotingRounds.Restore(false, 1, Winners(5))
        );

        Advance(session);

        session.PhaseProgress.CurrentPhase.ShouldBe(Phase.FinalPresentation);
    }

    private static void Advance(Session session, PhaseExitGuards? exitGuards = null)
    {
        session.AdvancePhase(TestSessions.CallerOf(session), exitGuards ?? AllGuards, []);
    }

    private static void ShouldRefuseToAdvance(Session session, Phase expectedPhase)
    {
        Should.Throw<WrongPhaseException>(() => Advance(session));

        session.PhaseProgress.CurrentPhase.ShouldBe(expectedPhase);
    }

    private static Session SessionInPhase(
        Phase phase,
        QuizProgress? quiz = null,
        FormationRecord? formation = null,
        PresentationWalk? presentation = null,
        VotingRounds? voting = null
    )
    {
        return TestSessions.InPhase(
            new SessionIdentity(Guid.NewGuid()),
            phase,
            quiz,
            formation: formation,
            presentation: presentation,
            voting: voting,
            revision: 7
        );
    }

    private static FormationRecord FormationOf(params bool[] submittedStates)
    {
        var groups = submittedStates.Select(
            (isSubmitted, index) =>
                Group.Restore(
                    $"group-{index}",
                    [Anna],
                    [new ValueId($"value-{index}")],
                    Anna,
                    isSubmitted
                )
        );

        return FormationRecord.Restore(true, groups);
    }

    private static IReadOnlyList<ValueId> Winners(int count)
    {
        return Enumerable
            .Range(1, count)
            .Select(number => new ValueId($"winner-{number}"))
            .ToList();
    }
}
