using Microsoft.AspNetCore.SignalR;
using ValuesWorkshop.Adapters.Web;
using ValuesWorkshop.Application;
using ValuesWorkshop.Application.Intents;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Tests;

public class FacilitatorHubTests
{
    private static readonly SessionIdentity KnownSession = new(
        Guid.Parse("00000000-0000-0000-0000-00000000f00d")
    );

    private readonly InMemorySessionRepository repository = new();
    private readonly RecordingBroadcaster broadcaster = new();
    private readonly RecordingHubClients<IFacilitatorClient> clients = new();
    private readonly RecordingGroupManager groups = new();
    private readonly SessionConnectionRegistry registry = new();

    [Fact]
    public async Task Connecting_pushes_the_current_facilitator_state_to_the_caller_only()
    {
        repository.Add(SessionInPhase(Phase.Quiz));
        var hub = HubBoundTo(KnownSession);

        await hub.OnConnectedAsync();

        var state = clients.CallerClient.Single<FacilitatorWorkshopState>();
        state.Phase.ShouldBe(Phase.Quiz);
        state.Revision.ShouldBe(1);
        clients.AddressedGroups.ShouldBeEmpty();
    }

    [Fact]
    public async Task Connecting_joins_the_facilitator_group_of_its_session()
    {
        repository.Add(SessionInPhase(Phase.Quiz));
        var hub = HubBoundTo(KnownSession);

        await hub.OnConnectedAsync();

        groups.JoinedGroups.ShouldBe([SessionGroups.Facilitator(KnownSession)]);
    }

    [Fact]
    public async Task Connecting_to_an_unknown_session_is_refused_and_pushes_nothing()
    {
        var hub = HubBoundTo(KnownSession);

        await Should.ThrowAsync<HubException>(hub.OnConnectedAsync);

        clients.CallerClient.ReceivedStates.ShouldBeEmpty();
        groups.JoinedGroups.ShouldBeEmpty();
    }

    [Fact]
    public async Task Connecting_without_a_session_identity_is_refused()
    {
        var hub = HubWithContext(new FakeHubCallerContext(subject: TestSessions.Facilitator.Value));

        await Should.ThrowAsync<HubException>(hub.OnConnectedAsync);
    }

    [Fact]
    public async Task Connecting_as_another_subject_is_refused_and_pushes_nothing()
    {
        repository.Add(SessionInPhase(Phase.Quiz));
        var hub = HubWithContext(
            new FakeHubCallerContext(KnownSession.Value.ToString(), "another-subject")
        );

        await Should.ThrowAsync<HubException>(hub.OnConnectedAsync);

        clients.CallerClient.ReceivedStates.ShouldBeEmpty();
        groups.JoinedGroups.ShouldBeEmpty();
    }

    [Fact]
    public async Task Connecting_without_an_authenticated_subject_is_refused()
    {
        repository.Add(SessionInPhase(Phase.Quiz));
        var hub = HubWithContext(new FakeHubCallerContext(KnownSession.Value.ToString()));

        await Should.ThrowAsync<HubException>(hub.OnConnectedAsync);

        clients.CallerClient.ReceivedStates.ShouldBeEmpty();
        groups.JoinedGroups.ShouldBeEmpty();
    }

    [Fact]
    public async Task Advancing_the_phase_mutates_persists_and_broadcasts()
    {
        repository.Add(SessionInPhase(Phase.Join));
        var hub = HubBoundTo(KnownSession);

        var result = await hub.AdvancePhase();

        result.ShouldBe(IntentResult.Accepted());
        repository.Saved.ShouldHaveSingleItem().PhaseProgress.CurrentPhase.ShouldBe(Phase.Quiz);
        broadcaster.Broadcasts.ShouldHaveSingleItem().Revision.ShouldBe(2);
    }

    [Fact]
    public async Task Advancing_as_a_subject_that_is_not_the_facilitator_is_rejected()
    {
        repository.Add(SessionInPhase(Phase.Join));
        var hub = HubWithContext(
            new FakeHubCallerContext(KnownSession.Value.ToString(), "another-subject")
        );

        var result = await hub.AdvancePhase();

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.NotAuthorized);
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    [Fact]
    public async Task Advancing_without_an_authenticated_subject_is_refused()
    {
        repository.Add(SessionInPhase(Phase.Join));
        var hub = HubWithContext(new FakeHubCallerContext(KnownSession.Value.ToString()));

        await Should.ThrowAsync<HubException>(hub.AdvancePhase);

        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    [Fact]
    public async Task Advancing_past_the_last_phase_is_rejected_and_broadcasts_nothing()
    {
        repository.Add(SessionInPhase(Phase.FinalPresentation));
        var hub = HubBoundTo(KnownSession);

        var result = await hub.AdvancePhase();

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.InvariantViolated);
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    [Fact]
    public async Task Advancing_out_of_voting_without_winners_is_rejected_and_broadcasts_nothing()
    {
        repository.Add(SessionInPhase(Phase.FinalVoting));
        var hub = HubBoundTo(KnownSession);

        var result = await hub.AdvancePhase();

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.WrongPhase);
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    [Fact]
    public async Task Advancing_an_unknown_session_is_rejected()
    {
        var hub = HubBoundTo(KnownSession);

        var result = await hub.AdvancePhase();

        result.Code.ShouldBe(IntentRejectionCode.UnknownSession);
    }

    [Fact]
    public async Task Revealing_the_answer_mutates_persists_and_broadcasts()
    {
        repository.Add(SessionInQuiz(QuizProgress.Restore(0, false, false, [])));
        var hub = HubBoundTo(KnownSession);

        var result = await hub.RevealAnswer();

        result.ShouldBe(IntentResult.Accepted());
        repository.Saved.ShouldHaveSingleItem().Quiz.IsRevealed.ShouldBeTrue();
        broadcaster.Broadcasts.ShouldHaveSingleItem().Revision.ShouldBe(2);
    }

    [Fact]
    public async Task Showing_the_learning_text_mutates_persists_and_broadcasts()
    {
        repository.Add(SessionInQuiz(QuizProgress.Restore(0, true, false, [])));
        var hub = HubBoundTo(KnownSession);

        var result = await hub.ShowLearningText();

        result.ShouldBe(IntentResult.Accepted());
        repository.Saved.ShouldHaveSingleItem().Quiz.IsLearningTextShown.ShouldBeTrue();
        broadcaster.Broadcasts.ShouldHaveSingleItem().Revision.ShouldBe(2);
    }

    [Fact]
    public async Task Posing_the_next_question_mutates_persists_and_broadcasts()
    {
        repository.Add(SessionInQuiz(QuizProgress.Restore(0, true, true, [])));
        var hub = HubBoundTo(KnownSession);

        var result = await hub.PoseNextQuestion();

        result.ShouldBe(IntentResult.Accepted());
        repository.Saved.ShouldHaveSingleItem().Quiz.CurrentQuestionIndex.ShouldBe(1);
        broadcaster.Broadcasts.ShouldHaveSingleItem().Revision.ShouldBe(2);
    }

    [Fact]
    public async Task Walking_the_quiz_as_a_subject_that_is_not_the_facilitator_is_rejected()
    {
        repository.Add(SessionInQuiz(QuizProgress.Restore(0, false, false, [])));
        var hub = HubWithContext(
            new FakeHubCallerContext(KnownSession.Value.ToString(), "another-subject")
        );

        var result = await hub.RevealAnswer();

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.NotAuthorized);
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    [Fact]
    public async Task Revealing_an_already_revealed_answer_is_accepted_and_changes_nothing()
    {
        repository.Add(SessionInQuiz(QuizProgress.Restore(0, true, false, [])));
        var hub = HubBoundTo(KnownSession);

        var result = await hub.RevealAnswer();

        result.IsAccepted.ShouldBeTrue();
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    [Fact]
    public async Task Reassigning_the_scribe_mutates_persists_and_broadcasts()
    {
        var anna = new ParticipantId(Guid.Parse("00000000-0000-0000-0000-0000000000a1"));
        var ben = new ParticipantId(Guid.Parse("00000000-0000-0000-0000-0000000000b2"));
        var session = Session.Restore(
            KnownSession,
            TestSessions.Facilitator,
            TestSessions.Name,
            Roster.Restore([
                TestParticipants.Named(anna, "Anna Schmidt"),
                TestParticipants.Named(ben, "Ben"),
            ]),
            PhaseProgress.Restore(Phase.GroupWork),
            QuizProgress.Restore(null, false, false, []),
            SelectionRound.Restore([], []),
            FormationRecord.Restore(
                true,
                [Group.Restore("tier-1", [anna, ben], [new ValueId("wert-1")], anna, false, [])]
            ),
            PresentationWalk.Restore(null, null, 0),
            VotingRounds.Restore([], null),
            new WinnerReveal(),
            revision: 1
        );
        repository.Add(session);
        var hub = HubBoundTo(KnownSession);

        var result = await hub.ReassignScribe(ben.Value.ToString());

        result.ShouldBe(IntentResult.Accepted());
        repository.Saved.ShouldHaveSingleItem().Formation.Groups[0].Scribe.ShouldBe(ben);
        broadcaster.Broadcasts.ShouldHaveSingleItem().Revision.ShouldBe(2);
    }

    [Fact]
    public async Task Reassigning_without_a_participant_identifier_is_rejected_as_a_malformed_payload()
    {
        repository.Add(SessionInPhase(Phase.GroupWork));
        var hub = HubBoundTo(KnownSession);

        var result = await hub.ReassignScribe(null);

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.MalformedPayload);
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    [Fact]
    public async Task Closing_the_voting_round_mutates_persists_and_broadcasts()
    {
        repository.Add(
            SessionInFinalVoting(TestVoting.MainRoundOpen(TestValueIds.Numbered(1, 10)))
        );
        var hub = HubBoundTo(KnownSession);

        var result = await hub.CloseVoting();

        result.ShouldBe(IntentResult.Accepted());
        var saved = repository.Saved.ShouldHaveSingleItem();
        saved.Voting.RoundOpen.ShouldBeFalse();
        saved.Voting.ClosedRounds.ShouldHaveSingleItem();
        broadcaster.Broadcasts.ShouldHaveSingleItem().Revision.ShouldBe(2);
    }

    [Fact]
    public async Task Starting_the_tiebreak_round_mutates_persists_and_broadcasts()
    {
        repository.Add(SessionInFinalVoting(TestVoting.AfterLocking(TestValueIds.Numbered(1, 4))));
        var hub = HubBoundTo(KnownSession);

        var result = await hub.StartTiebreakRound();

        result.ShouldBe(IntentResult.Accepted());
        var saved = repository.Saved.ShouldHaveSingleItem();
        saved.Voting.RoundOpen.ShouldBeTrue();
        saved.Voting.RoundNumber.ShouldBe(2);
        broadcaster.Broadcasts.ShouldHaveSingleItem().Revision.ShouldBe(2);
    }

    [Fact]
    public async Task Revealing_the_next_winner_mutates_persists_and_broadcasts()
    {
        var session = TestSessions.InPhase(
            KnownSession,
            Phase.FinalPresentation,
            voting: TestVoting.AfterLocking(
                TestValueIds.Numbered(1, VotingRounds.RequiredWinningValueCount)
            )
        );
        session.BumpRevision();
        repository.Add(session);
        var hub = HubBoundTo(KnownSession);

        var result = await hub.RevealNextValue();

        result.ShouldBe(IntentResult.Accepted());
        repository.Saved.ShouldHaveSingleItem().Reveal.RevealedCount.ShouldBe(1);
        broadcaster.Broadcasts.ShouldHaveSingleItem().Revision.ShouldBe(2);
    }

    private static Session SessionInFinalVoting(VotingRounds voting)
    {
        var session = TestSessions.InPhase(KnownSession, Phase.FinalVoting, voting: voting);

        session.BumpRevision();

        return session;
    }

    private static Session SessionInQuiz(QuizProgress quiz)
    {
        var session = TestSessions.InPhase(KnownSession, Phase.Quiz, quiz);

        session.BumpRevision();

        return session;
    }

    private static Session SessionInPhase(Phase phase)
    {
        var session = TestSessions.InPhase(KnownSession, phase);

        session.BumpRevision();

        return session;
    }

    private FacilitatorHub HubBoundTo(SessionIdentity sessionIdentity)
    {
        return HubWithContext(
            new FakeHubCallerContext(
                sessionIdentity.Value.ToString(),
                TestSessions.Facilitator.Value
            )
        );
    }

    private FacilitatorHub HubWithContext(FakeHubCallerContext context)
    {
        return new FacilitatorHub(
            repository,
            new FacilitatorIntentHandler(
                new IntentPipeline(new SessionCommandHandler(repository, broadcaster)),
                []
            ),
            TestWorkshopStateCache.Create(),
            registry
        )
        {
            Clients = clients,
            Groups = groups,
            Context = context,
        };
    }
}
