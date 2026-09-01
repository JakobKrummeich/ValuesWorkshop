using ValuesWorkshop.Application.Intents;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Tests;

public class FacilitatorRevealIntentTests
{
    private static readonly SessionIdentity KnownSession = new(
        Guid.Parse("00000000-0000-0000-0000-00000000f00d")
    );

    private readonly RecordingBroadcaster broadcaster = new();

    [Fact]
    public async Task The_facilitator_reveals_the_next_winner()
    {
        var repository = FakeSessionRepository.Holding(SessionRevealing(revealedCount: 1));

        var result = await HandlerOver(repository)
            .HandleAsync(new RevealNextValueCommand(KnownSession, TestSessions.FacilitatorCaller));

        result.ShouldBe(IntentResult.Accepted());
        repository.Saved.ShouldHaveSingleItem().Reveal.RevealedCount.ShouldBe(2);
        broadcaster.Broadcasts.ShouldHaveSingleItem().Reveal.RevealedCount.ShouldBe(2);
    }

    [Fact]
    public async Task Another_subject_may_not_reveal_a_winner()
    {
        var repository = FakeSessionRepository.Holding(SessionRevealing(revealedCount: 0));

        var result = await HandlerOver(repository)
            .HandleAsync(new RevealNextValueCommand(KnownSession, new CallerSubject("someone")));

        result.Code.ShouldBe(IntentRejectionCode.NotAuthorized);
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_reveal_beyond_the_last_winner_is_rejected_as_an_invariant_violation()
    {
        var repository = FakeSessionRepository.Holding(
            SessionRevealing(revealedCount: VotingRounds.RequiredWinningValueCount)
        );

        var result = await HandlerOver(repository)
            .HandleAsync(new RevealNextValueCommand(KnownSession, TestSessions.FacilitatorCaller));

        result.Code.ShouldBe(IntentRejectionCode.InvariantViolated);
        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_reveal_outside_the_final_presentation_is_rejected_as_a_wrong_phase()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(
                Phase.FinalVoting,
                voting: TestVoting.AfterLocking(
                    TestValueIds.Numbered(1, VotingRounds.RequiredWinningValueCount)
                )
            )
        );

        var result = await HandlerOver(repository)
            .HandleAsync(new RevealNextValueCommand(KnownSession, TestSessions.FacilitatorCaller));

        result.Code.ShouldBe(IntentRejectionCode.WrongPhase);
        repository.Saved.ShouldBeEmpty();
    }

    private static Session SessionRevealing(int revealedCount)
    {
        return SessionFixtures.InPhase(
            Phase.FinalPresentation,
            voting: TestVoting.AfterLocking(
                TestValueIds.Numbered(1, VotingRounds.RequiredWinningValueCount)
            ),
            reveal: WinnerReveal.Restore(revealedCount)
        );
    }

    private FacilitatorIntentHandler HandlerOver(FakeSessionRepository repository)
    {
        return new FacilitatorIntentHandler(
            new IntentPipeline(new SessionCommandHandler(repository, broadcaster)),
            []
        );
    }
}
