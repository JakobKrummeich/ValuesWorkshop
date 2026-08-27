using ValuesWorkshop.Application.Intents;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Tests;

public class ParticipantVotingIntentTests
{
    private static readonly SessionIdentity KnownSession = new(
        Guid.Parse("00000000-0000-0000-0000-00000000f00d")
    );

    private static readonly IReadOnlyList<ValueId> TenValues = TestValueIds.Numbered(1, 10);

    private readonly RecordingBroadcaster broadcaster = new();

    [Fact]
    public async Task A_participant_spends_the_full_allotment_across_eligible_values()
    {
        var repository = OpenRoundRepository();

        var result = await HandlerOver(repository)
            .HandleAsync(
                new SubmitFinalVotesCommand(
                    KnownSession,
                    SessionFixtures.Anna,
                    [new SubmitFinalVote("wert-1", 3), new SubmitFinalVote("wert-2", 2)]
                )
            );

        result.ShouldBe(IntentResult.Accepted());
        var saved = repository.Saved.ShouldHaveSingleItem();
        saved.Voting.HasVoted(SessionFixtures.Anna).ShouldBeTrue();
        saved.Voting.VotedCount.ShouldBe(1);
        broadcaster.Broadcasts.ShouldHaveSingleItem();
    }

    [Fact]
    public async Task A_ballot_without_votes_is_rejected_as_a_malformed_payload()
    {
        var repository = OpenRoundRepository();

        var result = await HandlerOver(repository)
            .HandleAsync(new SubmitFinalVotesCommand(KnownSession, SessionFixtures.Anna));

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.MalformedPayload);
        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_vote_without_a_value_identifier_is_rejected_as_a_malformed_payload()
    {
        var repository = OpenRoundRepository();

        var result = await HandlerOver(repository)
            .HandleAsync(
                new SubmitFinalVotesCommand(
                    KnownSession,
                    SessionFixtures.Anna,
                    [new SubmitFinalVote(" ", 5)]
                )
            );

        result.Code.ShouldBe(IntentRejectionCode.MalformedPayload);
    }

    [Fact]
    public async Task A_vote_without_a_count_is_rejected_as_a_malformed_payload()
    {
        var repository = OpenRoundRepository();

        var result = await HandlerOver(repository)
            .HandleAsync(
                new SubmitFinalVotesCommand(
                    KnownSession,
                    SessionFixtures.Anna,
                    [new SubmitFinalVote("wert-1", null)]
                )
            );

        result.Code.ShouldBe(IntentRejectionCode.MalformedPayload);
    }

    [Fact]
    public async Task A_ballot_listing_a_value_twice_is_rejected_as_a_malformed_payload()
    {
        var repository = OpenRoundRepository();

        var result = await HandlerOver(repository)
            .HandleAsync(
                new SubmitFinalVotesCommand(
                    KnownSession,
                    SessionFixtures.Anna,
                    [new SubmitFinalVote("wert-1", 3), new SubmitFinalVote("wert-1", 2)]
                )
            );

        result.Code.ShouldBe(IntentRejectionCode.MalformedPayload);
    }

    [Fact]
    public async Task A_ballot_missing_the_allotment_is_rejected_as_an_invariant_violation()
    {
        var repository = OpenRoundRepository();

        var result = await HandlerOver(repository)
            .HandleAsync(
                new SubmitFinalVotesCommand(
                    KnownSession,
                    SessionFixtures.Anna,
                    [new SubmitFinalVote("wert-1", 4)]
                )
            );

        result.Code.ShouldBe(IntentRejectionCode.InvariantViolated);
        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_ballot_on_an_ineligible_value_is_rejected_as_an_invariant_violation()
    {
        var repository = OpenRoundRepository();

        var result = await HandlerOver(repository)
            .HandleAsync(
                new SubmitFinalVotesCommand(
                    KnownSession,
                    SessionFixtures.Anna,
                    [new SubmitFinalVote("wert-11", 5)]
                )
            );

        result.Code.ShouldBe(IntentRejectionCode.InvariantViolated);
    }

    [Fact]
    public async Task A_second_ballot_in_the_same_round_is_rejected_as_an_invariant_violation()
    {
        var voting = TestVoting.MainRoundOpen(TenValues);
        voting.RecordBallot(
            SessionFixtures.Anna,
            new Dictionary<ValueId, int> { [TenValues[0]] = 5 }
        );
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.FinalVoting, voting: voting)
        );

        var result = await HandlerOver(repository)
            .HandleAsync(
                new SubmitFinalVotesCommand(
                    KnownSession,
                    SessionFixtures.Anna,
                    [new SubmitFinalVote("wert-2", 5)]
                )
            );

        result.Code.ShouldBe(IntentRejectionCode.InvariantViolated);
        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_ballot_while_the_round_is_closed_is_rejected_as_an_invariant_violation()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(
                Phase.FinalVoting,
                voting: TestVoting.AfterLocking(TenValues.Take(4).ToList())
            )
        );

        var result = await HandlerOver(repository)
            .HandleAsync(
                new SubmitFinalVotesCommand(
                    KnownSession,
                    SessionFixtures.Anna,
                    [new SubmitFinalVote("tied-1", 1)]
                )
            );

        result.Code.ShouldBe(IntentRejectionCode.InvariantViolated);
    }

    [Fact]
    public async Task A_ballot_outside_final_voting_is_rejected_as_a_wrong_phase()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.ValuePresentation)
        );

        var result = await HandlerOver(repository)
            .HandleAsync(
                new SubmitFinalVotesCommand(
                    KnownSession,
                    SessionFixtures.Anna,
                    [new SubmitFinalVote("wert-1", 5)]
                )
            );

        result.Code.ShouldBe(IntentRejectionCode.WrongPhase);
    }

    [Fact]
    public async Task A_stranger_may_not_cast_final_votes()
    {
        var repository = OpenRoundRepository();

        var result = await HandlerOver(repository)
            .HandleAsync(
                new SubmitFinalVotesCommand(
                    KnownSession,
                    new ParticipantId(Guid.NewGuid()),
                    [new SubmitFinalVote("wert-1", 5)]
                )
            );

        result.Code.ShouldBe(IntentRejectionCode.NotAuthorized);
        repository.Saved.ShouldBeEmpty();
    }

    private static FakeSessionRepository OpenRoundRepository()
    {
        return FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.FinalVoting, voting: TestVoting.MainRoundOpen(TenValues))
        );
    }

    private ParticipantIntentHandler HandlerOver(FakeSessionRepository repository)
    {
        return new ParticipantIntentHandler(
            new IntentPipeline(new SessionCommandHandler(repository, broadcaster)),
            new TestValuesCatalog(50)
        );
    }
}
