namespace ValuesWorkshop.Domain.Tests;

public class ScribeAppointmentTests
{
    private static readonly ParticipantId Anna = new(Guid.NewGuid());
    private static readonly ParticipantId Ben = new(Guid.NewGuid());
    private static readonly ParticipantId Chris = new(Guid.NewGuid());
    private static readonly ParticipantId Dana = new(Guid.NewGuid());

    [Fact]
    public void Entering_group_work_appoints_the_member_the_randomness_names_in_every_group()
    {
        var session = GroupWorkSession(
            Group.Restore("fox", [Anna, Ben], [new ValueId("wert-1")], null, false, []),
            Group.Restore("owl", [Chris, Dana], [new ValueId("wert-2")], null, false, [])
        );

        new ScribeAppointment(new FixedRandomness(1)).ExecuteFor(session);

        session.Formation.Groups[0].Scribe.ShouldBe(Ben);
        session.Formation.Groups[1].Scribe.ShouldBe(Dana);
    }

    [Fact]
    public void A_session_outside_group_work_is_left_untouched()
    {
        var session = TestSessions.InPhase(
            new SessionIdentity(Guid.NewGuid()),
            Phase.GroupFormation,
            formation: FormationRecord.Restore(
                true,
                [Group.Restore("fox", [Anna, Ben], [new ValueId("wert-1")], null, false, [])]
            )
        );

        new ScribeAppointment(new FixedRandomness(0)).ExecuteFor(session);

        session.Formation.Groups[0].Scribe.ShouldBeNull();
    }

    [Fact]
    public void A_restart_keeps_the_scribes_a_previous_entry_appointed()
    {
        var session = GroupWorkSession(
            Group.Restore("fox", [Anna, Ben], [new ValueId("wert-1")], Anna, false, [])
        );

        new ScribeAppointment(new FixedRandomness(1)).ExecuteFor(session);

        session.Formation.Groups[0].Scribe.ShouldBe(Anna);
    }

    [Fact]
    public void Running_the_appointment_twice_never_re_appoints()
    {
        var session = GroupWorkSession(
            Group.Restore("fox", [Anna, Ben], [new ValueId("wert-1")], null, false, [])
        );

        new ScribeAppointment(new FixedRandomness(0)).ExecuteFor(session);
        new ScribeAppointment(new FixedRandomness(1)).ExecuteFor(session);

        session.Formation.Groups[0].Scribe.ShouldBe(Anna);
    }

    [Fact]
    public void A_group_without_members_stays_scribeless_instead_of_crashing_the_entry()
    {
        var session = GroupWorkSession(
            Group.Restore("fox", [], [new ValueId("wert-1")], null, false, []),
            Group.Restore("owl", [Chris, Dana], [new ValueId("wert-2")], null, false, [])
        );

        new ScribeAppointment(new FixedRandomness(0)).ExecuteFor(session);

        session.Formation.Groups[0].Scribe.ShouldBeNull();
        session.Formation.Groups[1].Scribe.ShouldBe(Chris);
    }

    [Fact]
    public void A_group_that_already_has_a_scribe_is_skipped_while_others_get_one()
    {
        var session = GroupWorkSession(
            Group.Restore("fox", [Anna, Ben], [new ValueId("wert-1")], Ben, false, []),
            Group.Restore("owl", [Chris, Dana], [new ValueId("wert-2")], null, false, [])
        );

        new ScribeAppointment(new FixedRandomness(0)).ExecuteFor(session);

        session.Formation.Groups[0].Scribe.ShouldBe(Ben);
        session.Formation.Groups[1].Scribe.ShouldBe(Chris);
    }

    private static Session GroupWorkSession(params Group[] groups)
    {
        return TestSessions.InPhase(
            new SessionIdentity(Guid.NewGuid()),
            Phase.GroupWork,
            formation: FormationRecord.Restore(true, groups)
        );
    }
}
