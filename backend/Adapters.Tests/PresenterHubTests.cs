using System.Reflection;
using Microsoft.AspNetCore.SignalR;
using ValuesWorkshop.Adapters.Web;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Tests;

public class PresenterHubTests
{
    private static readonly SessionIdentity KnownSession = new(
        Guid.Parse("00000000-0000-0000-0000-00000000f00d")
    );

    private readonly InMemorySessionRepository repository = new();
    private readonly RecordingHubClients<IPresenterClient> clients = new();
    private readonly RecordingGroupManager groups = new();
    private readonly SessionConnectionRegistry registry = new();

    [Fact]
    public async Task Connecting_pushes_the_current_presenter_state_and_joins_the_presenter_group()
    {
        var session = TestSessions.Open(KnownSession);
        TestSessions.AdvanceToNextPhase(session);
        repository.Add(session);
        var hub = HubBoundTo(KnownSession);

        await hub.OnConnectedAsync();

        clients.CallerClient.Single<PresenterWorkshopState>().Phase.ShouldBe(Phase.Quiz);
        groups.JoinedGroups.ShouldBe([SessionGroups.Presenter(KnownSession)]);
    }

    [Fact]
    public async Task Connecting_to_an_unknown_session_is_refused()
    {
        var hub = HubBoundTo(KnownSession);

        await Should.ThrowAsync<HubException>(hub.OnConnectedAsync);
    }

    [Fact]
    public void The_presenter_hub_exposes_no_intent_at_all()
    {
        var declaredMethods = typeof(PresenterHub)
            .GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
            .Select(method => method.Name);

        declaredMethods.ShouldBe(
            [nameof(Hub.OnConnectedAsync), nameof(Hub.OnDisconnectedAsync)],
            ignoreOrder: true
        );
    }

    private PresenterHub HubBoundTo(SessionIdentity sessionIdentity)
    {
        return new PresenterHub(repository, new WorkshopStateCache(), registry)
        {
            Clients = clients,
            Groups = groups,
            Context = new FakeHubCallerContext(sessionIdentity.Value.ToString()),
        };
    }
}
