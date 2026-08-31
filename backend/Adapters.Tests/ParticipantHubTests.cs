using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using ValuesWorkshop.Adapters.Web;
using ValuesWorkshop.Application;
using ValuesWorkshop.Application.Intents;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Tests;

public class ParticipantHubTests
{
    private const string Subject = "anna";

    private static readonly SessionIdentity KnownSession = new(
        Guid.Parse("00000000-0000-0000-0000-00000000f00d")
    );

    private static readonly ParticipantId Anna = CallerParticipantIdentity.ForSubject(
        KnownSession,
        Subject
    );

    private static readonly IReadOnlyList<string> TenValueIds = Enumerable
        .Range(1, 10)
        .Select(valueNumber => $"wert-{valueNumber}")
        .ToList();

    private readonly InMemorySessionRepository repository = new();
    private readonly RecordingBroadcaster broadcaster = new();
    private readonly RecordingHubClients<IParticipantClient> clients = new();
    private readonly RecordingGroupManager groups = new();
    private readonly SessionConnectionRegistry registry = new();

    [Fact]
    public async Task Connecting_puts_a_newcomer_on_the_roster_and_broadcasts_the_new_state()
    {
        var session = TestSessions.Open(KnownSession);
        repository.Add(session);
        var hub = HubBoundTo(KnownSession, Subject);

        await hub.OnConnectedAsync();

        session.Roster.Participants.ShouldBe([TestParticipants.Named(Anna, "Anna Schmidt")]);
        broadcaster.Broadcasts.ShouldHaveSingleItem().Revision.ShouldBe(1);
    }

    [Fact]
    public async Task A_returning_participant_resumes_instead_of_joining_twice()
    {
        var session = TestSessions.Open(KnownSession);
        session.Join(TestParticipants.Named(Anna, "Anna Schmidt"), new FixedRandomness(0));
        repository.Add(session);
        var hub = HubBoundTo(KnownSession, Subject);

        await hub.OnConnectedAsync();

        session.Roster.Participants.ShouldBe([TestParticipants.Named(Anna, "Anna Schmidt")]);
        session.Revision.ShouldBe(0);
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_reconnecting_participant_is_pushed_its_state_immediately()
    {
        var session = TestSessions.Open(KnownSession);
        session.Join(TestParticipants.Named(Anna, "Anna Schmidt"), new FixedRandomness(0));
        repository.Add(session);
        var hub = HubBoundTo(KnownSession, Subject);

        await hub.OnConnectedAsync();

        clients
            .CallerClient.Single<ParticipantWorkshopState>()
            .ShouldBeOfType<ParticipantJoinState>();
    }

    [Fact]
    public void The_same_subject_is_the_same_participant_in_one_session_and_nobody_else_elsewhere()
    {
        CallerParticipantIdentity
            .ForSubject(KnownSession, Subject)
            .ShouldBe(CallerParticipantIdentity.ForSubject(KnownSession, Subject));
        CallerParticipantIdentity.ForSubject(KnownSession, "ben").ShouldNotBe(Anna);
        CallerParticipantIdentity
            .ForSubject(new SessionIdentity(Guid.NewGuid()), Subject)
            .ShouldNotBe(Anna);
    }

    [Fact]
    public async Task Connecting_joins_the_group_that_only_this_participant_receives()
    {
        repository.Add(TestSessions.Open(KnownSession));
        var hub = HubBoundTo(KnownSession, Subject);

        await hub.OnConnectedAsync();

        groups.JoinedGroups.ShouldBe([SessionGroups.Participant(KnownSession, Anna)]);
    }

    [Fact]
    public async Task Connecting_to_an_unknown_session_is_refused_and_broadcasts_nothing()
    {
        var hub = HubBoundTo(KnownSession, Subject);

        await Should.ThrowAsync<HubException>(hub.OnConnectedAsync);

        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    [Fact]
    public async Task Connecting_without_an_authenticated_subject_is_refused()
    {
        repository.Add(TestSessions.Open(KnownSession));
        var hub = HubWithContext(
            new FakeHubCallerContext(KnownSession.Value.ToString(), subject: null)
        );

        await Should.ThrowAsync<HubException>(hub.OnConnectedAsync);

        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task Choosing_an_answer_mutates_persists_and_broadcasts()
    {
        var session = TestSessions.InPhase(
            KnownSession,
            Phase.Quiz,
            QuizProgress.Restore(0, false, false, [])
        );
        session.Join(TestParticipants.Named(Anna, "Anna Schmidt"), new FixedRandomness(0));
        repository.Add(session);
        var hub = HubBoundTo(KnownSession, Subject);

        var result = await hub.ChooseQuizAnswer(0, 2);

        result.ShouldBe(IntentResult.Accepted());
        repository
            .Saved.ShouldHaveSingleItem()
            .Quiz.CastAnswers.ShouldBe([new CastAnswer(0, Anna, 2)]);
        broadcaster.Broadcasts.ShouldHaveSingleItem().Revision.ShouldBe(1);
    }

    [Fact]
    public async Task Choosing_an_out_of_range_answer_is_rejected_as_a_malformed_payload()
    {
        var session = TestSessions.InPhase(
            KnownSession,
            Phase.Quiz,
            QuizProgress.Restore(0, false, false, [])
        );
        session.Join(TestParticipants.Named(Anna, "Anna Schmidt"), new FixedRandomness(0));
        repository.Add(session);
        var hub = HubBoundTo(KnownSession, Subject);

        var result = await hub.ChooseQuizAnswer(0, 3);

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.MalformedPayload);
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    [Fact]
    public async Task Submitting_a_value_selection_mutates_persists_and_broadcasts()
    {
        var session = TestSessions.InPhase(KnownSession, Phase.ValueSelection);
        session.Join(TestParticipants.Named(Anna, "Anna Schmidt"), new FixedRandomness(0));
        repository.Add(session);
        var hub = HubBoundTo(KnownSession, Subject);

        var result = await hub.SubmitValueSelection(TenValueIds);

        result.ShouldBe(IntentResult.Accepted());
        repository.Saved.ShouldHaveSingleItem().Selection.SubmittedBy.ShouldBe([Anna]);
        broadcaster.Broadcasts.ShouldHaveSingleItem().Revision.ShouldBe(1);
    }

    [Fact]
    public async Task Submitting_nine_values_is_rejected_as_a_malformed_payload()
    {
        var session = TestSessions.InPhase(KnownSession, Phase.ValueSelection);
        session.Join(TestParticipants.Named(Anna, "Anna Schmidt"), new FixedRandomness(0));
        repository.Add(session);
        var hub = HubBoundTo(KnownSession, Subject);

        var result = await hub.SubmitValueSelection(TenValueIds.Take(9).ToList());

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.MalformedPayload);
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    [Fact]
    public async Task Submitting_without_a_value_list_is_rejected_as_a_malformed_payload()
    {
        var session = TestSessions.InPhase(KnownSession, Phase.ValueSelection);
        session.Join(TestParticipants.Named(Anna, "Anna Schmidt"), new FixedRandomness(0));
        repository.Add(session);
        var hub = HubBoundTo(KnownSession, Subject);

        var result = await hub.SubmitValueSelection(null);

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.MalformedPayload);
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    private static readonly ActionId KnownAction = new(
        Guid.Parse("00000000-0000-0000-0000-00000000ac10")
    );

    private void SessionInGroupWork(bool isSubmitted, params GroupAction[] actions)
    {
        var session = Session.Restore(
            KnownSession,
            TestSessions.Facilitator,
            TestSessions.Name,
            Roster.Restore([TestParticipants.Named(Anna, "Anna Schmidt")]),
            PhaseProgress.Restore(Phase.GroupWork),
            QuizProgress.Restore(null, false, false, []),
            SelectionRound.Restore([], []),
            FormationRecord.Restore(
                true,
                [
                    Group.Restore(
                        "tier-1",
                        [Anna],
                        [new ValueId("wert-1")],
                        Anna,
                        isSubmitted,
                        actions
                    ),
                ]
            ),
            PresentationWalk.Restore(null, null, 0),
            VotingRounds.Restore([], null),
            new WinnerReveal(),
            revision: 1
        );
        repository.Add(session);
    }

    private static GroupAction TierOneAction(string text)
    {
        return new GroupAction(KnownAction, new ValueId("wert-1"), GroupActionText.Of(text));
    }

    [Fact]
    public async Task Adding_an_action_mutates_persists_and_broadcasts()
    {
        SessionInGroupWork(isSubmitted: false);
        var hub = HubBoundTo(KnownSession, Subject);

        var result = await hub.AddAction("wert-1");

        result.ShouldBe(IntentResult.Accepted());
        repository
            .Saved.ShouldHaveSingleItem()
            .Formation.Groups[0]
            .Actions.ShouldHaveSingleItem()
            .Text.IsEmpty.ShouldBeTrue();
        broadcaster.Broadcasts.ShouldHaveSingleItem();
    }

    [Fact]
    public async Task Adding_an_action_without_a_payload_is_rejected_as_a_malformed_payload()
    {
        SessionInGroupWork(isSubmitted: false);
        var hub = HubBoundTo(KnownSession, Subject);

        var result = await hub.AddAction(null);

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.MalformedPayload);
        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task Editing_an_action_mutates_persists_and_broadcasts()
    {
        SessionInGroupWork(isSubmitted: false, TierOneAction("Old wording"));
        var hub = HubBoundTo(KnownSession, Subject);

        var result = await hub.EditAction(KnownAction.Value.ToString(), "New wording");

        result.ShouldBe(IntentResult.Accepted());
        repository
            .Saved.ShouldHaveSingleItem()
            .Formation.Groups[0]
            .Actions.ShouldHaveSingleItem()
            .Text.Value.ShouldBe("New wording");
    }

    [Fact]
    public async Task Removing_an_action_mutates_persists_and_broadcasts()
    {
        SessionInGroupWork(isSubmitted: false, TierOneAction("Obsolete"));
        var hub = HubBoundTo(KnownSession, Subject);

        var result = await hub.RemoveAction(KnownAction.Value.ToString());

        result.ShouldBe(IntentResult.Accepted());
        repository.Saved.ShouldHaveSingleItem().Formation.Groups[0].Actions.ShouldBeEmpty();
    }

    [Fact]
    public async Task Submitting_the_group_work_mutates_persists_and_broadcasts()
    {
        SessionInGroupWork(isSubmitted: false, TierOneAction("Talk"));
        var hub = HubBoundTo(KnownSession, Subject);

        var result = await hub.SubmitGroupWork(null);

        result.ShouldBe(IntentResult.Accepted());
        repository.Saved.ShouldHaveSingleItem().Formation.Groups[0].IsSubmitted.ShouldBeTrue();
        broadcaster.Broadcasts.ShouldHaveSingleItem();
    }

    [Fact]
    public async Task Submitting_with_actions_applies_final_edits_before_submitting()
    {
        SessionInGroupWork(isSubmitted: false, TierOneAction("Old wording"));
        var hub = HubBoundTo(KnownSession, Subject);

        var result = await hub.SubmitGroupWork([
            new SubmitGroupWorkValuePayload(
                "wert-1",
                [new SubmitGroupWorkActionPayload(KnownAction.Value.ToString(), "Final wording")]
            ),
        ]);

        result.ShouldBe(IntentResult.Accepted());
        var group = repository.Saved.ShouldHaveSingleItem().Formation.Groups[0];
        group.IsSubmitted.ShouldBeTrue();
        group.Actions.ShouldHaveSingleItem().Text.Value.ShouldBe("Final wording");
    }

    [Fact]
    public async Task Reopening_the_group_work_mutates_persists_and_broadcasts()
    {
        SessionInGroupWork(isSubmitted: true, TierOneAction("Talk"));
        var hub = HubBoundTo(KnownSession, Subject);

        var result = await hub.ReopenGroupWork();

        result.ShouldBe(IntentResult.Accepted());
        repository.Saved.ShouldHaveSingleItem().Formation.Groups[0].IsSubmitted.ShouldBeFalse();
        broadcaster.Broadcasts.ShouldHaveSingleItem();
    }

    private static readonly IReadOnlyList<ValueId> EligibleValues = TestValueIds.Numbered(1, 5);

    private void SessionInFinalVoting()
    {
        var session = TestSessions.InPhase(
            KnownSession,
            Phase.FinalVoting,
            voting: TestVoting.MainRoundOpen(EligibleValues)
        );
        session.Join(TestParticipants.Named(Anna, "Anna Schmidt"), new FixedRandomness(0));
        repository.Add(session);
    }

    [Fact]
    public async Task Casting_final_votes_puts_the_ballot_on_the_tallies_and_broadcasts()
    {
        SessionInFinalVoting();
        var hub = HubBoundTo(KnownSession, Subject);

        var result = await hub.SubmitFinalVotes([
            new SubmitFinalVotePayload("wert-1", 2),
            new SubmitFinalVotePayload("wert-2", 1),
            new SubmitFinalVotePayload("wert-3", 1),
            new SubmitFinalVotePayload("wert-4", 1),
        ]);

        result.ShouldBe(IntentResult.Accepted());
        var saved = repository.Saved.ShouldHaveSingleItem();
        saved.Voting.HasVoted(Anna).ShouldBeTrue();
        saved.Voting.OpenRoundTallies[EligibleValues[0]].ShouldBe(2);
        saved.Voting.OpenRoundTallies[EligibleValues[1]].ShouldBe(1);
        saved.Voting.OpenRoundTallies[EligibleValues[4]].ShouldBe(0);
        broadcaster.Broadcasts.ShouldHaveSingleItem();
    }

    [Fact]
    public async Task Casting_a_ballot_without_votes_is_rejected_as_a_malformed_payload()
    {
        SessionInFinalVoting();
        var hub = HubBoundTo(KnownSession, Subject);

        var result = await hub.SubmitFinalVotes(null);

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.MalformedPayload);
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    [Fact]
    public async Task Choosing_an_answer_without_an_authenticated_subject_is_refused()
    {
        repository.Add(
            TestSessions.InPhase(
                KnownSession,
                Phase.Quiz,
                QuizProgress.Restore(0, false, false, [])
            )
        );
        var hub = HubWithContext(
            new FakeHubCallerContext(KnownSession.Value.ToString(), subject: null)
        );

        await Should.ThrowAsync<HubException>(() => hub.ChooseQuizAnswer(0, 0));

        repository.Saved.ShouldBeEmpty();
    }

    private ParticipantHub HubBoundTo(SessionIdentity sessionIdentity, string subject)
    {
        return HubWithContext(
            new FakeHubCallerContext(
                sessionIdentity.Value.ToString(),
                subject,
                new Claim("name", "Anna Schmidt")
            )
        );
    }

    private ParticipantHub HubWithContext(FakeHubCallerContext context)
    {
        var pipeline = new IntentPipeline(new SessionCommandHandler(repository, broadcaster));

        return new ParticipantHub(
            repository,
            pipeline,
            new ParticipantIntentHandler(pipeline, new TestValuesCatalog(50)),
            new ParticipantWorkshopStateMapper(
                new TestQuizCatalog(5),
                new TestValuesCatalog(50),
                new TestAnimalsCatalog(8),
                new TestFormationProgress(0)
            ),
            TestWorkshopStateCache.Create(),
            new FixedRandomness(0),
            registry
        )
        {
            Clients = clients,
            Groups = groups,
            Context = context,
        };
    }
}
