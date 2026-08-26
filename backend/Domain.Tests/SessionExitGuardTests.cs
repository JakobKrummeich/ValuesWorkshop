namespace ValuesWorkshop.Domain.Tests;

public class SessionExitGuardTests
{
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

        session.AdvancePhase();

        session.PhaseProgress.CurrentPhase.ShouldBe(Phase.ValueSelection);
    }

    [Fact]
    public void Group_formation_may_not_be_left_while_the_groups_are_still_forming()
    {
        var session = SessionInPhase(Phase.GroupFormation);

        ShouldRefuseToAdvance(session, Phase.GroupFormation);
    }

    [Fact]
    public void Group_formation_may_be_left_once_the_groups_stand()
    {
        var session = SessionInPhase(
            Phase.GroupFormation,
            formation: FormationOf(submittedStates: [false, false])
        );

        session.AdvancePhase();

        session.PhaseProgress.CurrentPhase.ShouldBe(Phase.GroupWork);
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

        session.AdvancePhase();

        session.PhaseProgress.CurrentPhase.ShouldBe(Phase.ValuePresentation);
    }

    [Fact]
    public void Group_work_may_be_left_once_every_group_has_submitted()
    {
        var session = SessionInPhase(
            Phase.GroupWork,
            formation: FormationOf(submittedStates: [true, true])
        );

        session.AdvancePhase();

        session.PhaseProgress.CurrentPhase.ShouldBe(Phase.ValuePresentation);
    }

    [Fact]
    public void Group_work_becomes_leavable_once_every_scribe_submits()
    {
        var session = SessionInPhase(
            Phase.GroupWork,
            formation: FormationOf(submittedStates: [false, false])
        );
        ShouldRefuseToAdvance(session, Phase.GroupWork);

        foreach (var group in session.Formation.Groups)
        {
            var scribe = group.Scribe.ShouldNotBeNull();
            var actionId = new ActionId(Guid.NewGuid());
            group.AddAction(scribe, actionId, group.AssignedValues[0]);
            group.EditAction(scribe, actionId, GroupActionText.Of("Talk openly about mistakes"));
            group.Submit(scribe);
        }
        session.AdvancePhase();

        session.PhaseProgress.CurrentPhase.ShouldBe(Phase.ValuePresentation);
    }

    [Fact]
    public void The_value_presentation_guard_is_unsatisfied_before_every_value_is_shown()
    {
        var session = SessionInPhase(
            Phase.ValuePresentation,
            presentation: PresentationWalk.Restore("Otter", new ValueId("honesty"), 2)
        );

        new ValuePresentationExitGuard(PresentedValueCount: 3)
            .IsSatisfiedBy(session)
            .ShouldBeFalse();
    }

    [Fact]
    public void The_value_presentation_guard_is_satisfied_once_every_value_is_shown()
    {
        var session = SessionInPhase(
            Phase.ValuePresentation,
            presentation: PresentationWalk.Restore("Otter", new ValueId("courage"), 3)
        );

        new ValuePresentationExitGuard(PresentedValueCount: 3)
            .IsSatisfiedBy(session)
            .ShouldBeTrue();
    }

    [Fact]
    public void Value_presentation_is_left_freely_when_no_values_were_assigned()
    {
        var session = SessionInPhase(
            Phase.ValuePresentation,
            presentation: PresentationWalk.Restore(null, null, 0)
        );

        session.AdvancePhase();

        session.PhaseProgress.CurrentPhase.ShouldBe(Phase.FinalVoting);
    }

    [Fact]
    public void Value_presentation_may_not_be_left_before_every_assigned_value_is_shown()
    {
        var session = SessionInPhase(
            Phase.ValuePresentation,
            formation: FormationOf(submittedStates: [true, true]),
            presentation: PresentationWalk.Restore("group-0", new ValueId("value-0"), 1)
        );

        ShouldRefuseToAdvance(session, Phase.ValuePresentation);
    }

    [Fact]
    public void Value_presentation_may_be_left_once_every_assigned_value_is_shown()
    {
        var session = SessionInPhase(
            Phase.ValuePresentation,
            formation: FormationOf(submittedStates: [true, true]),
            presentation: PresentationWalk.Restore("group-1", new ValueId("value-1"), 2)
        );

        session.AdvancePhase();

        session.PhaseProgress.CurrentPhase.ShouldBe(Phase.FinalVoting);
    }

    [Fact]
    public void Final_voting_may_not_be_left_before_five_winners_stand()
    {
        var session = SessionInPhase(
            Phase.FinalVoting,
            voting: TestVoting.AfterLocking(Winners(4))
        );

        ShouldRefuseToAdvance(session, Phase.FinalVoting);
    }

    [Fact]
    public void Final_voting_may_be_left_once_five_winners_stand()
    {
        var session = SessionInPhase(
            Phase.FinalVoting,
            voting: TestVoting.AfterLocking(Winners(5))
        );

        session.AdvancePhase();

        session.PhaseProgress.CurrentPhase.ShouldBe(Phase.FinalPresentation);
    }

    private static void ShouldRefuseToAdvance(Session session, Phase expectedPhase)
    {
        Should.Throw<WrongPhaseException>(() => session.AdvancePhase());

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
            {
                var scribe = new ParticipantId(Guid.NewGuid());
                return Group.Restore(
                    $"group-{index}",
                    [scribe],
                    [new ValueId($"value-{index}")],
                    scribe,
                    isSubmitted,
                    []
                );
            }
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
