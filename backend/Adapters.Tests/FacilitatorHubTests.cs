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
        var hub = HubWithContext(new FakeHubCallerContext(subject: "facilitator"));

        await Should.ThrowAsync<HubException>(hub.OnConnectedAsync);
    }

    [Fact]
    public async Task Advancing_the_phase_mutates_persists_and_broadcasts()
    {
        repository.Add(SessionInPhase(Phase.Quiz));
        var hub = HubBoundTo(KnownSession);

        var result = await hub.AdvancePhase();

        result.ShouldBe(IntentResult.Accepted());
        repository
            .Saved.ShouldHaveSingleItem()
            .PhaseProgress.CurrentPhase.ShouldBe(Phase.ValueSelection);
        broadcaster.Broadcasts.ShouldHaveSingleItem().Revision.ShouldBe(2);
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
    public async Task Advancing_an_unknown_session_is_rejected()
    {
        var hub = HubBoundTo(KnownSession);

        var result = await hub.AdvancePhase();

        result.Code.ShouldBe(IntentRejectionCode.UnknownSession);
    }

    private static Session SessionInPhase(Phase phase)
    {
        var session = TestSessions.Open(KnownSession);

        while (session.PhaseProgress.CurrentPhase != phase)
        {
            session.AdvancePhase();
        }

        session.BumpRevision();

        return session;
    }

    private FacilitatorHub HubBoundTo(SessionIdentity sessionIdentity)
    {
        return HubWithContext(
            new FakeHubCallerContext(sessionIdentity.Value.ToString(), "facilitator")
        );
    }

    private FacilitatorHub HubWithContext(FakeHubCallerContext context)
    {
        return new FacilitatorHub(
            repository,
            new IntentPipeline(new SessionCommandHandler(repository, broadcaster)),
            new WorkshopStateCache(),
            registry
        )
        {
            Clients = clients,
            Groups = groups,
            Context = context,
        };
    }
}
