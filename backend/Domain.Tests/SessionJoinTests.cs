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
    public void Joining_puts_the_participant_on_the_roster_under_their_name()
    {
        var session = TestSessions.Open(new SessionIdentity(Guid.NewGuid()));

        session.Join(TestParticipants.Named(Anna, "Anna"), Randomness.Fixed(0));

        session.Roster.Participants.ShouldBe([TestParticipants.Named(Anna, "Anna")]);
    }

    [Fact]
    public void Joining_twice_resumes_the_existing_place_instead_of_creating_a_second_one()
    {
        var session = TestSessions.Open(new SessionIdentity(Guid.NewGuid()));

        session.Join(TestParticipants.Named(Anna, "Anna"), Randomness.Fixed(0)).ShouldBeTrue();
        session.Join(TestParticipants.Named(Anna, "Anna"), Randomness.Fixed(0)).ShouldBeFalse();

        session.Roster.Participants.ShouldBe([TestParticipants.Named(Anna, "Anna")]);
    }

    [Fact]
    public void Rejoining_under_a_different_name_keeps_the_name_of_the_first_join()
    {
        var session = TestSessions.Open(new SessionIdentity(Guid.NewGuid()));

        session.Join(TestParticipants.Named(Anna, "Anna"), Randomness.Fixed(0));
        session.Join(TestParticipants.Named(Anna, "Someone else"), Randomness.Fixed(0));

        session.Roster.Find(Anna).ShouldBe(TestParticipants.Named(Anna, "Anna"));
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

        session.Join(TestParticipants.Named(Latecomer, "Late Lucy"), Randomness.Fixed(0));

        session.Roster.Contains(Latecomer).ShouldBeTrue();
    }

    [Fact]
    public void Joining_before_group_formation_places_the_participant_in_no_group()
    {
        var session = SessionInPhase(Phase.Quiz, new FormationRecord());

        session.Join(TestParticipants.Named(Latecomer, "Late Lucy"), Randomness.Fixed(0));

        session.Formation.Groups.ShouldBeEmpty();
    }

    [Fact]
    public void Joining_after_group_formation_places_the_participant_in_the_smallest_group()
    {
        var session = SessionInPhase(Phase.GroupWork, TwoGroups());

        session.Join(TestParticipants.Named(Latecomer, "Late Lucy"), Randomness.Fixed(0));

        GroupNamed(session, "owl").Members.ShouldBe([Ben, Latecomer]);
        GroupNamed(session, "fox").Members.ShouldNotContain(Latecomer);
    }

    [Fact]
    public void A_tie_between_smallest_groups_is_broken_randomly()
    {
        var session = SessionInPhase(Phase.GroupWork, TwoGroupsOfEqualSize());

        session.Join(TestParticipants.Named(Latecomer, "Late Lucy"), Randomness.Fixed(1));

        GroupNamed(session, "owl").Members.ShouldContain(Latecomer);
        GroupNamed(session, "fox").Members.ShouldNotContain(Latecomer);
    }

    [Fact]
    public void Placing_a_late_joiner_never_re_deals_the_assigned_values()
    {
        var session = SessionInPhase(
            Phase.GroupWork,
            FormationRecord.Restore(
                true,
                [
                    Group.Restore("fox", [Anna, Chris], [new ValueId("wert-1")], Anna, false),
                    Group.Restore("owl", [Ben], [new ValueId("wert-2")], Ben, false),
                ]
            )
        );

        session.Join(TestParticipants.Named(Latecomer, "Late Lucy"), Randomness.Fixed(0));

        GroupNamed(session, "fox").AssignedValues.ShouldBe([new ValueId("wert-1")]);
        GroupNamed(session, "owl").AssignedValues.ShouldBe([new ValueId("wert-2")]);
        GroupNamed(session, "owl").Members.ShouldBe([Ben, Latecomer]);
    }

    [Fact]
    public void A_participant_placed_into_a_group_never_becomes_its_scribe()
    {
        var session = SessionInPhase(Phase.GroupWork, TwoGroups());

        session.Join(TestParticipants.Named(Latecomer, "Late Lucy"), Randomness.Fixed(0));

        GroupNamed(session, "owl").Scribe.ShouldBe(Ben);
    }

    [Fact]
    public void A_group_that_already_submitted_its_work_stays_submitted()
    {
        var session = SessionInPhase(Phase.GroupWork, TwoGroups());

        session.Join(TestParticipants.Named(Latecomer, "Late Lucy"), Randomness.Fixed(0));

        GroupNamed(session, "owl").IsSubmitted.ShouldBeTrue();
    }

    [Fact]
    public void Resuming_an_existing_place_never_changes_group_membership()
    {
        var session = SessionInPhase(Phase.GroupWork, TwoGroups());

        session.Join(TestParticipants.Named(Ben, "Ben"), Randomness.Fixed(0));

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
            Roster.Restore([
                TestParticipants.Named(Anna, "Anna"),
                TestParticipants.Named(Ben, "Ben"),
            ]),
            PhaseProgress.Restore(phase),
            QuizProgress.Restore(null, false, false, []),
            SelectionRound.Restore([], []),
            formation,
            PresentationWalk.Restore(null, null, 0),
            VotingRounds.Restore(false, 0, []),
            revision: 0
        );
    }
}
