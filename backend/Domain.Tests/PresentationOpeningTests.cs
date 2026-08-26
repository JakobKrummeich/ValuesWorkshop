namespace ValuesWorkshop.Domain.Tests;

public class PresentationOpeningTests
{
    [Fact]
    public void Entering_value_presentation_stands_the_walk_on_the_first_groups_intro()
    {
        var session = SessionIn(Phase.ValuePresentation);

        new PresentationOpening().ExecuteFor(session);

        session.Presentation.PresentingGroup.ShouldBe("otter");
        session.Presentation.PresentedValue.ShouldBeNull();
        session.Presentation.ShownValueCount.ShouldBe(0);
    }

    [Fact]
    public void Outside_value_presentation_the_walk_stays_untouched()
    {
        var session = SessionIn(Phase.GroupWork);

        new PresentationOpening().ExecuteFor(session);

        session.Presentation.PresentingGroup.ShouldBeNull();
    }

    [Fact]
    public void A_walk_already_underway_keeps_its_position()
    {
        var session = SessionIn(
            Phase.ValuePresentation,
            PresentationWalk.Restore("fuchs", new ValueId("honesty"), 2)
        );

        new PresentationOpening().ExecuteFor(session);

        session.Presentation.PresentingGroup.ShouldBe("fuchs");
        session.Presentation.PresentedValue.ShouldBe(new ValueId("honesty"));
    }

    private static Session SessionIn(Phase phase, PresentationWalk? presentation = null)
    {
        var member = new ParticipantId(Guid.NewGuid());

        return TestSessions.InPhase(
            new SessionIdentity(Guid.NewGuid()),
            phase,
            formation: FormationRecord.Restore(
                true,
                [
                    Group.Restore("otter", [member], [new ValueId("honesty")], member, true, []),
                    Group.Restore("fuchs", [member], [new ValueId("trust")], member, true, []),
                ]
            ),
            presentation: presentation
        );
    }
}
