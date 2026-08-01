namespace ValuesWorkshop.Domain.Tests;

public class SessionJoinTests
{
    private static readonly ParticipantId Anna = new(
        Guid.Parse("00000000-0000-0000-0000-0000000000a1")
    );
    private static readonly ParticipantId Ben = new(
        Guid.Parse("00000000-0000-0000-0000-0000000000b2")
    );
    private static readonly ParticipantId Chris = new(
        Guid.Parse("00000000-0000-0000-0000-0000000000c3")
    );
    private static readonly ParticipantId Dana = new(
        Guid.Parse("00000000-0000-0000-0000-0000000000d4")
    );
    private static readonly ParticipantId Latecomer = new(
        Guid.Parse("00000000-0000-0000-0000-0000000000ff")
    );

    [Fact]
    public void Joining_puts_the_participant_on_the_roster()
    {
        var session = TestSessions.Open(new SessionIdentity(Guid.NewGuid()));

        session.Join(Anna, Randomness.Fixed(0));

        session.Roster.Participants.ShouldBe([Anna]);
    }

    [Fact]
    public void Joining_twice_resumes_the_existing_place_instead_of_creating_a_second_one()
    {
        var session = TestSessions.Open(new SessionIdentity(Guid.NewGuid()));

        session.Join(Anna, Randomness.Fixed(0));
        session.Join(Anna, Randomness.Fixed(0));

        session.Roster.Participants.ShouldBe([Anna]);
    }

    [Theory]
    [InlineData(Phase.Join)]
    [InlineData(Phase.Quiz)]
    [InlineData(Phase.ValueSelection)]
    [InlineData(Phase.SelectionResults)]
    [InlineData(Phase.FinalVoting)]
    [InlineData(Phase.FinalPresentation)]
    public void Joining_is_allowed_in_every_phase(Phase phase)
    {
        var session = SessionInPhase(phase, new FormationRecord());

        session.Join(Latecomer, Randomness.Fixed(0));

        session.Roster.Participants.ShouldContain(Latecomer);
    }

    [Fact]
    public void Joining_before_group_formation_places_the_participant_in_no_group()
    {
        var session = SessionInPhase(Phase.Quiz, new FormationRecord());

        session.Join(Latecomer, Randomness.Fixed(0));

        session.Formation.Groups.ShouldBeEmpty();
    }

    [Fact]
    public void Joining_after_group_formation_places_the_participant_in_the_smallest_group()
    {
        var session = SessionInPhase(Phase.GroupWork, TwoGroups());

        session.Join(Latecomer, Randomness.Fixed(0));

        GroupNamed(session, "owl").Members.ShouldBe([Ben, Latecomer]);
        GroupNamed(session, "fox").Members.ShouldNotContain(Latecomer);
    }

    [Fact]
    public void A_tie_between_smallest_groups_is_broken_randomly()
    {
        var session = SessionInPhase(Phase.GroupWork, TwoGroupsOfEqualSize());

        session.Join(Latecomer, Randomness.Fixed(1));

        GroupNamed(session, "owl").Members.ShouldContain(Latecomer);
        GroupNamed(session, "fox").Members.ShouldNotContain(Latecomer);
    }

    [Fact]
    public void A_participant_placed_into_a_group_never_becomes_its_scribe()
    {
        var session = SessionInPhase(Phase.GroupWork, TwoGroups());

        session.Join(Latecomer, Randomness.Fixed(0));

        GroupNamed(session, "owl").Scribe.ShouldBe(Ben);
    }

    [Fact]
    public void A_group_that_already_submitted_its_work_stays_submitted()
    {
        var session = SessionInPhase(Phase.GroupWork, TwoGroups());

        session.Join(Latecomer, Randomness.Fixed(0));

        GroupNamed(session, "owl").IsSubmitted.ShouldBeTrue();
    }

    [Fact]
    public void Resuming_an_existing_place_never_changes_group_membership()
    {
        var session = SessionInPhase(Phase.GroupWork, TwoGroups());

        session.Join(Ben, Randomness.Fixed(0));

        GroupNamed(session, "owl").Members.ShouldBe([Ben]);
    }

    private static Group GroupNamed(Session session, string name)
    {
        return session.Formation.Groups.Single(group => group.Name == name);
    }

    private static FormationRecord TwoGroups()
    {
        return FormationRecord.Restore(
            true,
            [
                Group.Restore("fox", [Anna, Chris, Dana], [], Anna, false),
                Group.Restore("owl", [Ben], [], Ben, true),
            ]
        );
    }

    private static FormationRecord TwoGroupsOfEqualSize()
    {
        return FormationRecord.Restore(
            true,
            [
                Group.Restore("fox", [Anna], [], Anna, false),
                Group.Restore("owl", [Ben], [], Ben, false),
            ]
        );
    }

    private static Session SessionInPhase(Phase phase, FormationRecord formation)
    {
        return Session.Restore(
            new SessionIdentity(Guid.NewGuid()),
            TestSessions.Facilitator,
            TestSessions.Name,
            Roster.Restore([Anna, Ben]),
            PhaseProgress.Restore(phase),
            QuizProgress.Restore(null, false, false),
            SelectionRound.Restore([], []),
            formation,
            PresentationWalk.Restore(null, null),
            VotingRounds.Restore(false, 0, []),
            revision: 0
        );
    }
}
