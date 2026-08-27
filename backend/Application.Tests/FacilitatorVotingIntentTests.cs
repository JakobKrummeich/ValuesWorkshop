using ValuesWorkshop.Application.Intents;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Tests;

public class FacilitatorVotingIntentTests
{
    private static readonly SessionIdentity KnownSession = new(
        Guid.Parse("00000000-0000-0000-0000-00000000f00d")
    );

    private static readonly IReadOnlyList<ValueId> TenValues = TestValueIds.Numbered(1, 10);

    private readonly RecordingBroadcaster broadcaster = new();

    [Fact]
    public async Task Entering_final_voting_opens_the_main_round_over_the_dealt_values()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(
                Phase.ValuePresentation,
                formation: PresentedGroups(),
                presentation: PresentationWalk.Restore("tier-2", new ValueId("wert-2"), 2)
            )
        );
        var handler = new FacilitatorIntentHandler(
            new IntentPipeline(new SessionCommandHandler(repository, broadcaster)),
            [new VotingOpening()]
        );

        var result = await handler.HandleAsync(
            new AdvancePhaseCommand(KnownSession, TestSessions.FacilitatorCaller)
        );

        result.ShouldBe(IntentResult.Accepted());
        var saved = repository.Saved.ShouldHaveSingleItem();
        saved.PhaseProgress.CurrentPhase.ShouldBe(Phase.FinalVoting);
        saved.Voting.RoundOpen.ShouldBeTrue();
        saved.Voting.Allotment.ShouldBe(5);
        saved.Voting.EligibleValues.ShouldBe([new ValueId("wert-1"), new ValueId("wert-2")]);
    }

    [Fact]
    public async Task The_facilitator_closes_the_open_round()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.FinalVoting, voting: TestVoting.MainRoundOpen(TenValues))
        );

        var result = await HandlerOver(repository)
            .HandleAsync(new CloseVotingCommand(KnownSession, TestSessions.FacilitatorCaller));

        result.ShouldBe(IntentResult.Accepted());
        var saved = repository.Saved.ShouldHaveSingleItem();
        saved.Voting.RoundOpen.ShouldBeFalse();
        saved.Voting.ClosedRounds.ShouldHaveSingleItem();
        broadcaster.Broadcasts.ShouldHaveSingleItem();
    }

    [Fact]
    public async Task Closing_an_already_closed_round_is_accepted_without_a_broadcast()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(
                Phase.FinalVoting,
                voting: TestVoting.AfterLocking(TenValues.Take(4).ToList())
            )
        );

        var result = await HandlerOver(repository)
            .HandleAsync(new CloseVotingCommand(KnownSession, TestSessions.FacilitatorCaller));

        result.ShouldBe(IntentResult.Accepted());
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    [Fact]
    public async Task Only_the_facilitator_closes_the_round()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.FinalVoting, voting: TestVoting.MainRoundOpen(TenValues))
        );

        var result = await HandlerOver(repository)
            .HandleAsync(new CloseVotingCommand(KnownSession, new CallerSubject("someone-else")));

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.NotAuthorized);
        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task Closing_outside_final_voting_is_rejected_as_a_wrong_phase()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.ValuePresentation)
        );

        var result = await HandlerOver(repository)
            .HandleAsync(new CloseVotingCommand(KnownSession, TestSessions.FacilitatorCaller));

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.WrongPhase);
        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task The_facilitator_starts_the_tiebreak_over_the_tied_values()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(
                Phase.FinalVoting,
                voting: TestVoting.AfterLocking(TenValues.Take(4).ToList())
            )
        );

        var result = await HandlerOver(repository)
            .HandleAsync(
                new StartTiebreakRoundCommand(KnownSession, TestSessions.FacilitatorCaller)
            );

        result.ShouldBe(IntentResult.Accepted());
        var saved = repository.Saved.ShouldHaveSingleItem();
        saved.Voting.RoundOpen.ShouldBeTrue();
        saved.Voting.RoundNumber.ShouldBe(2);
        saved.Voting.Allotment.ShouldBe(1);
        broadcaster.Broadcasts.ShouldHaveSingleItem();
    }

    [Fact]
    public async Task A_tiebreak_without_a_pending_tie_is_rejected_as_an_invariant_violation()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(
                Phase.FinalVoting,
                voting: TestVoting.AfterLocking(TenValues.Take(5).ToList())
            )
        );

        var result = await HandlerOver(repository)
            .HandleAsync(
                new StartTiebreakRoundCommand(KnownSession, TestSessions.FacilitatorCaller)
            );

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.InvariantViolated);
        result.Detail.ShouldNotBeNullOrWhiteSpace();
        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task Restarting_the_running_tiebreak_is_accepted_without_a_broadcast()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(
                Phase.FinalVoting,
                voting: TestVoting.TiebreakOpen(2, TenValues.Take(3).ToList(), allotment: 2)
            )
        );

        var result = await HandlerOver(repository)
            .HandleAsync(
                new StartTiebreakRoundCommand(KnownSession, TestSessions.FacilitatorCaller)
            );

        result.ShouldBe(IntentResult.Accepted());
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    private static FormationRecord PresentedGroups()
    {
        return FormationRecord.Restore(
            true,
            [
                Group.Restore(
                    "tier-1",
                    [SessionFixtures.Anna],
                    [new ValueId("wert-1")],
                    SessionFixtures.Anna,
                    true,
                    []
                ),
                Group.Restore(
                    "tier-2",
                    [SessionFixtures.Chris],
                    [new ValueId("wert-2")],
                    SessionFixtures.Chris,
                    true,
                    []
                ),
            ]
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
