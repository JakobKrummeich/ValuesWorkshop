namespace ValuesWorkshop.Domain.Tests;

public class VotingOpeningTests
{
    private static readonly ValueId Honesty = new("honesty");
    private static readonly ValueId Trust = new("trust");
    private static readonly ValueId Courage = new("courage");

    [Fact]
    public void Entering_final_voting_opens_the_main_round_over_all_dealt_values()
    {
        var session = SessionIn(Phase.FinalVoting);

        new VotingOpening().ExecuteFor(session);

        session.Voting.RoundOpen.ShouldBeTrue();
        session.Voting.RoundNumber.ShouldBe(1);
        session.Voting.Allotment.ShouldBe(VotingRounds.RequiredWinningValueCount);
        session.Voting.EligibleValues.ShouldBe([Honesty, Trust, Courage]);
    }

    [Fact]
    public void Outside_final_voting_the_voting_stays_untouched()
    {
        var session = SessionIn(Phase.ValuePresentation);

        new VotingOpening().ExecuteFor(session);

        session.Voting.RoundOpen.ShouldBeFalse();
        session.Voting.RoundNumber.ShouldBe(0);
    }

    [Fact]
    public void A_voting_already_underway_keeps_its_state()
    {
        var member = new ParticipantId(Guid.NewGuid());
        var session = SessionIn(Phase.FinalVoting);
        new VotingOpening().ExecuteFor(session);
        session.Voting.RecordBallot(member, new Dictionary<ValueId, int> { [Honesty] = 5 });

        new VotingOpening().ExecuteFor(session);

        session.Voting.VotedCount.ShouldBe(1);
        session.Voting.OpenRoundTallies[Honesty].ShouldBe(5);
    }

    private static Session SessionIn(Phase phase)
    {
        var member = new ParticipantId(Guid.NewGuid());

        return TestSessions.InPhase(
            new SessionIdentity(Guid.NewGuid()),
            phase,
            formation: FormationRecord.Restore(
                true,
                [
                    Group.Restore("otter", [member], [Honesty, Trust], member, true, []),
                    Group.Restore("fuchs", [member], [Courage], member, true, []),
                ]
            )
        );
    }
}
