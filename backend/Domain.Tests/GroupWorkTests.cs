namespace ValuesWorkshop.Domain.Tests;

public class GroupWorkTests
{
    private static readonly ParticipantId Anna = new(Guid.NewGuid());
    private static readonly ParticipantId Ben = new(Guid.NewGuid());
    private static readonly ParticipantId Chris = new(Guid.NewGuid());
    private static readonly ParticipantId Dana = new(Guid.NewGuid());
    private static readonly ParticipantId GrouplessGrete = new(Guid.NewGuid());
    private static readonly ValueId Trust = new("vertrauen");
    private static readonly ValueId Courage = new("mut");

    [Fact]
    public void The_scribe_adds_an_action_to_the_callers_own_group()
    {
        var session = SessionInPhase(Phase.GroupWork);
        var actionId = new ActionId(Guid.NewGuid());

        GroupWork.AddAction(session, Anna, actionId, Trust);

        GroupNamed(session, "fox")
            .Actions.ShouldBe([new GroupAction(actionId, Trust, GroupActionText.Of(null))]);
        GroupNamed(session, "owl").Actions.ShouldBeEmpty();
    }

    [Fact]
    public void The_scribe_edits_and_removes_actions_through_the_session()
    {
        var session = SessionInPhase(Phase.GroupWork);
        var kept = new ActionId(Guid.NewGuid());
        var removed = new ActionId(Guid.NewGuid());
        GroupWork.AddAction(session, Anna, kept, Trust);
        GroupWork.AddAction(session, Anna, removed, Trust);

        GroupWork.EditAction(session, Anna, kept, GroupActionText.Of("Talk openly"));
        GroupWork.RemoveAction(session, Anna, removed);

        GroupNamed(session, "fox")
            .Actions.ShouldBe([new GroupAction(kept, Trust, GroupActionText.Of("Talk openly"))]);
    }

    [Fact]
    public void The_scribe_submits_and_reopens_through_the_session()
    {
        var session = SessionInPhase(Phase.GroupWork);
        var actionId = new ActionId(Guid.NewGuid());
        GroupWork.AddAction(session, Anna, actionId, Trust);
        GroupWork.EditAction(session, Anna, actionId, GroupActionText.Of("Talk"));

        GroupWork.Submit(session, Anna);
        GroupNamed(session, "fox").IsSubmitted.ShouldBeTrue();

        GroupWork.Reopen(session, Anna);
        GroupNamed(session, "fox").IsSubmitted.ShouldBeFalse();
    }

    [Fact]
    public void A_caller_off_the_roster_cannot_work_on_a_group_result()
    {
        var session = SessionInPhase(Phase.GroupWork);

        Should.Throw<NotAuthorizedException>(() =>
            GroupWork.AddAction(
                session,
                new ParticipantId(Guid.NewGuid()),
                new ActionId(Guid.NewGuid()),
                Trust
            )
        );
    }

    [Fact]
    public void A_joined_participant_outside_every_group_cannot_work_on_a_group_result()
    {
        var session = SessionInPhase(Phase.GroupWork);

        Should.Throw<NotAuthorizedException>(() => GroupWork.Submit(session, GrouplessGrete));
    }

    [Fact]
    public void The_group_work_commands_exist_only_during_the_group_work_phase()
    {
        var session = SessionInPhase(Phase.GroupFormation);

        Should.Throw<WrongPhaseException>(() =>
            GroupWork.AddAction(session, Anna, new ActionId(Guid.NewGuid()), Trust)
        );
    }

    [Fact]
    public void Reopening_after_group_work_has_ended_is_refused()
    {
        var session = SessionInPhase(Phase.ValuePresentation, owlSubmitted: true);

        Should.Throw<WrongPhaseException>(() => GroupWork.Reopen(session, Chris));

        GroupNamed(session, "owl").IsSubmitted.ShouldBeTrue();
    }

    [Fact]
    public void The_scribe_role_lands_in_the_targets_own_group()
    {
        var session = SessionInPhase(Phase.GroupWork);

        GroupWork.ReassignScribe(session, Dana);

        GroupNamed(session, "owl").Scribe.ShouldBe(Dana);
        GroupNamed(session, "fox").Scribe.ShouldBe(Anna);
    }

    [Fact]
    public void After_reassignment_the_old_scribe_is_refused_and_the_new_one_accepted()
    {
        var session = SessionInPhase(Phase.GroupWork);
        GroupWork.ReassignScribe(session, Ben);

        Should.Throw<NotAuthorizedException>(() =>
            GroupWork.AddAction(session, Anna, new ActionId(Guid.NewGuid()), Trust)
        );
        var actionId = new ActionId(Guid.NewGuid());
        GroupWork.AddAction(session, Ben, actionId, Trust);
        GroupNamed(session, "fox").Actions.Select(action => action.ActionId).ShouldBe([actionId]);
    }

    [Fact]
    public void A_target_off_the_roster_cannot_become_scribe()
    {
        var session = SessionInPhase(Phase.GroupWork);

        Should.Throw<UnknownParticipantException>(() =>
            GroupWork.ReassignScribe(session, new ParticipantId(Guid.NewGuid()))
        );
    }

    [Fact]
    public void A_joined_participant_outside_every_group_cannot_become_scribe()
    {
        var session = SessionInPhase(Phase.GroupWork);

        Should.Throw<InvariantViolationException>(() =>
            GroupWork.ReassignScribe(session, GrouplessGrete)
        );
    }

    [Fact]
    public void The_scribe_role_is_reassigned_even_while_the_result_is_submitted()
    {
        var session = SessionInPhase(Phase.GroupWork, owlSubmitted: true);

        GroupWork.ReassignScribe(session, Dana);
        GroupWork.Reopen(session, Dana);

        GroupNamed(session, "owl").Scribe.ShouldBe(Dana);
        GroupNamed(session, "owl").IsSubmitted.ShouldBeFalse();
    }

    [Fact]
    public void The_scribe_role_is_not_reassigned_before_group_work()
    {
        var session = SessionInPhase(Phase.GroupFormation);

        Should.Throw<WrongPhaseException>(() => GroupWork.ReassignScribe(session, Ben));
    }

    [Fact]
    public void The_scribe_role_is_not_reassigned_after_group_work()
    {
        var session = SessionInPhase(Phase.ValuePresentation);

        Should.Throw<WrongPhaseException>(() => GroupWork.ReassignScribe(session, Ben));
    }

    private static Group GroupNamed(Session session, string name)
    {
        return session.Formation.Groups.Single(group => group.Name == name);
    }

    private static Session SessionInPhase(Phase phase, bool owlSubmitted = false)
    {
        return Session.Restore(
            new SessionIdentity(Guid.NewGuid()),
            TestSessions.Facilitator,
            TestSessions.Name,
            Roster.Restore([
                TestParticipants.Named(Anna, "Anna"),
                TestParticipants.Named(Ben, "Ben"),
                TestParticipants.Named(Chris, "Chris"),
                TestParticipants.Named(Dana, "Dana"),
                TestParticipants.Named(GrouplessGrete, "Grete"),
            ]),
            PhaseProgress.Restore(phase),
            QuizProgress.Restore(null, false, false, []),
            SelectionRound.Restore([], []),
            FormationRecord.Restore(
                true,
                [
                    Group.Restore("fox", [Anna, Ben], [Trust], Anna, false, []),
                    Group.Restore("owl", [Chris, Dana], [Courage], Chris, owlSubmitted, []),
                ]
            ),
            PresentationWalk.Restore(null, null, 0),
            VotingRounds.Restore([], null),
            0
        );
    }
}
