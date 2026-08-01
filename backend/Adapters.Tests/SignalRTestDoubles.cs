using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Connections.Features;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.SignalR;
using ValuesWorkshop.Adapters.Web;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Adapters.Tests;

internal sealed class RecordingClient : IFacilitatorClient, IParticipantClient, IPresenterClient
{
    internal List<object> ReceivedStates { get; } = [];

    public Task ReceiveWorkshopState(FacilitatorWorkshopState state)
    {
        return Record(state);
    }

    public Task ReceiveWorkshopState(ParticipantWorkshopState state)
    {
        return Record(state);
    }

    public Task ReceiveWorkshopState(PresenterWorkshopState state)
    {
        return Record(state);
    }

    internal TState Single<TState>()
    {
        return ReceivedStates.OfType<TState>().ShouldHaveSingleItem();
    }

    private Task Record(object state)
    {
        ReceivedStates.Add(state);
        return Task.CompletedTask;
    }
}

internal sealed class RecordingHubClients<TClient> : IHubCallerClients<TClient>
    where TClient : class
{
    private readonly Dictionary<string, RecordingClient> groups = [];

    internal RecordingClient CallerClient { get; } = new();

    internal RecordingClient GroupClient(string groupName)
    {
        if (!groups.TryGetValue(groupName, out var client))
        {
            client = new RecordingClient();
            groups[groupName] = client;
        }

        return client;
    }

    internal IReadOnlyCollection<string> AddressedGroups => groups.Keys;

    public TClient Caller => As(CallerClient);

    public TClient Group(string groupName)
    {
        return As(GroupClient(groupName));
    }

    public TClient All => throw new NotSupportedException();

    public TClient Others => throw new NotSupportedException();

    public TClient AllExcept(IReadOnlyList<string> excludedConnectionIds)
    {
        throw new NotSupportedException();
    }

    public TClient Client(string connectionId)
    {
        throw new NotSupportedException();
    }

    public TClient Clients(IReadOnlyList<string> connectionIds)
    {
        throw new NotSupportedException();
    }

    public TClient GroupExcept(string groupName, IReadOnlyList<string> excludedConnectionIds)
    {
        throw new NotSupportedException();
    }

    public TClient Groups(IReadOnlyList<string> groupNames)
    {
        throw new NotSupportedException();
    }

    public TClient OthersInGroup(string groupName)
    {
        throw new NotSupportedException();
    }

    public TClient User(string userId)
    {
        throw new NotSupportedException();
    }

    public TClient Users(IReadOnlyList<string> userIds)
    {
        throw new NotSupportedException();
    }

    private static TClient As(RecordingClient client)
    {
        return (TClient)(object)client;
    }
}

internal sealed class RecordingHubContext<THub, TClient>(RecordingHubClients<TClient> clients)
    : IHubContext<THub, TClient>
    where THub : Hub<TClient>
    where TClient : class
{
    public IHubClients<TClient> Clients => clients;

    public IGroupManager Groups { get; } = new RecordingGroupManager();
}

internal sealed class RecordingGroupManager : IGroupManager
{
    internal List<string> JoinedGroups { get; } = [];

    public Task AddToGroupAsync(
        string connectionId,
        string groupName,
        CancellationToken cancellationToken = default
    )
    {
        JoinedGroups.Add(groupName);
        return Task.CompletedTask;
    }

    public Task RemoveFromGroupAsync(
        string connectionId,
        string groupName,
        CancellationToken cancellationToken = default
    )
    {
        JoinedGroups.Remove(groupName);
        return Task.CompletedTask;
    }
}

internal sealed class FakeHubCallerContext : HubCallerContext
{
    private readonly FeatureCollection features = new();

    internal FakeHubCallerContext(string? sessionIdentityQuery = null, string? subject = null)
    {
        var httpContext = new DefaultHttpContext();

        if (sessionIdentityQuery is not null)
        {
            httpContext.Request.QueryString = QueryString.Create(
                "sessionIdentity",
                sessionIdentityQuery
            );
        }

        features.Set<IHttpContextFeature>(new HttpContextFeature { HttpContext = httpContext });

        User = subject is null
            ? new ClaimsPrincipal(new ClaimsIdentity())
            : new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", subject)], "test"));
    }

    public override string ConnectionId => "connection-1";

    public override string? UserIdentifier => null;

    public override ClaimsPrincipal? User { get; }

    public override IDictionary<object, object?> Items { get; } = new Dictionary<object, object?>();

    public override IFeatureCollection Features => features;

    public override CancellationToken ConnectionAborted => CancellationToken.None;

    public override void Abort() { }

    private sealed class HttpContextFeature : IHttpContextFeature
    {
        public HttpContext? HttpContext { get; set; }
    }
}

internal sealed class InMemorySessionRepository : ISessionRepository
{
    private readonly Dictionary<SessionIdentity, Session> sessions = [];

    internal List<Session> Saved { get; } = [];

    internal void Add(Session session)
    {
        sessions[session.Identity] = session;
    }

    public Task<Session?> LoadAsync(SessionIdentity sessionIdentity)
    {
        return Task.FromResult(sessions.GetValueOrDefault(sessionIdentity));
    }

    public Task CreateAsync(Session session)
    {
        if (!sessions.TryAdd(session.Identity, session))
        {
            throw new ConcurrencyConflictException(
                session.Identity,
                expectedRevision: 0,
                sessions[session.Identity].Revision
            );
        }

        return Task.CompletedTask;
    }

    public Task SaveAsync(Session session, long expectedRevision)
    {
        sessions[session.Identity] = session;
        Saved.Add(session);
        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<Session>> LoadAllAsync()
    {
        return Task.FromResult<IReadOnlyList<Session>>(sessions.Values.ToList());
    }
}

internal sealed class RecordingBroadcaster : ValuesWorkshop.Application.IBroadcaster
{
    internal List<Session> Broadcasts { get; } = [];

    public Task BroadcastSessionStateAsync(Session session)
    {
        Broadcasts.Add(session);
        return Task.CompletedTask;
    }
}

internal sealed class FixedRandomness(int index) : IRandomness
{
    public int NextIndex(int exclusiveUpperBound)
    {
        return index % exclusiveUpperBound;
    }
}
