namespace ValuesWorkshop.Domain.Tests;

public class FinalVotingTests
{
    private static readonly IReadOnlyList<ValueId> TenValues = TestValueIds.Numbered(1, 10);

    private static readonly ParticipantId Anna = new(
        Guid.Parse("a0000000-0000-0000-0000-000000000001")
    );

    [Fact]
    public void A_joined_participant_casts_final_votes()
    {
        var session = VotingSession();

        FinalVoting.SubmitVotes(session, Anna, Votes((1, 3), (2, 2)));

        session.Voting.HasVoted(Anna).ShouldBeTrue();
        session.Voting.OpenRoundTallies[TenValues[0]].ShouldBe(3);
    }

    [Fact]
    public void A_stranger_may_not_cast_final_votes()
    {
        var session = VotingSession();

        Should.Throw<NotAuthorizedException>(() =>
            FinalVoting.SubmitVotes(session, new ParticipantId(Guid.NewGuid()), Votes((1, 5)))
        );
    }

    [Fact]
    public void Votes_outside_the_final_voting_phase_are_refused()
    {
        var session = VotingSession(Phase.ValuePresentation);

        Should.Throw<WrongPhaseException>(() =>
            FinalVoting.SubmitVotes(session, Anna, Votes((1, 5)))
        );
    }

    [Fact]
    public void The_facilitator_closes_the_round_and_the_winners_may_stand()
    {
        var session = VotingSession();
        FinalVoting.SubmitVotes(session, Anna, Votes((1, 1), (2, 1), (3, 1), (4, 1), (5, 1)));

        FinalVoting.CloseVoting(session);

        session.Voting.RoundOpen.ShouldBeFalse();
        session.Voting.WinnersStand.ShouldBeTrue();
    }

    [Fact]
    public void Closing_outside_the_final_voting_phase_is_refused()
    {
        var session = VotingSession(Phase.ValuePresentation);

        Should.Throw<WrongPhaseException>(() => FinalVoting.CloseVoting(session));
    }

    [Fact]
    public void A_tiebreak_round_starts_over_the_tied_values()
    {
        var session = VotingSession();
        FinalVoting.CloseVoting(session);

        FinalVoting.StartTiebreakRound(session);

        session.Voting.RoundOpen.ShouldBeTrue();
        session.Voting.RoundNumber.ShouldBe(2);
        session.Voting.EligibleValues.ShouldBe(TenValues);
    }

    [Fact]
    public void A_tiebreak_outside_the_final_voting_phase_is_refused()
    {
        var session = VotingSession(Phase.ValuePresentation);

        Should.Throw<WrongPhaseException>(() => FinalVoting.StartTiebreakRound(session));
    }

    private static Session VotingSession(Phase phase = Phase.FinalVoting)
    {
        var session = TestSessions.InPhase(new SessionIdentity(Guid.NewGuid()), phase);
        session.Join(
            new Participant(Anna, ParticipantName.Of("Anna", Anna)),
            new FixedRandomness(0)
        );
        session.Voting.OpenRound(VotingRounds.RequiredWinningValueCount, TenValues);
        return session;
    }

    private static Dictionary<ValueId, int> Votes(params (int ValueNumber, int VoteCount)[] votes)
    {
        return votes.ToDictionary(
            vote => new ValueId($"wert-{vote.ValueNumber}"),
            vote => vote.VoteCount
        );
    }
}
