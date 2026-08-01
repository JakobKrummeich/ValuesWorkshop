using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using ValuesWorkshop.Adapters.Web;
using ValuesWorkshop.Application.Intents;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Host.Tests;

public sealed class HubProtocolTests : IClassFixture<WorkshopTestFactory>, IAsyncLifetime
{
    private readonly WorkshopTestFactory factory;
    private readonly List<HubConnection> connections = [];

    public HubProtocolTests(WorkshopTestFactory factory)
    {
        this.factory = factory;
    }

    [Fact]
    public async Task A_connecting_participant_is_pushed_the_current_state_at_once()
    {
        var sessionIdentity = await SeededSession();

        var (_, inbox) = await ConnectParticipant(sessionIdentity, "anna");

        var state = await inbox.NextAsync();
        state.Phase.ShouldBe(Phase.Join);
        state.ParticipantCount.ShouldBe(1);
        state.Revision.ShouldBeGreaterThan(0);
    }

    [Fact]
    public async Task An_accepted_facilitator_intent_reaches_every_role()
    {
        var sessionIdentity = await SeededSession();
        var (_, participantInbox) = await ConnectParticipant(sessionIdentity, "anna");
        var (_, presenterInbox) = await ConnectPresenter(sessionIdentity);
        var (facilitator, facilitatorInbox) = await ConnectFacilitator(sessionIdentity, "olga");
        await participantInbox.NextAsync();
        await presenterInbox.NextAsync();
        await facilitatorInbox.NextAsync();

        var result = await facilitator.InvokeAsync<IntentResult>(
            nameof(FacilitatorHub.AdvancePhase)
        );

        result.IsAccepted.ShouldBeTrue();
        await participantInbox.NextMatchingAsync(state => state.Phase == Phase.Quiz);
        await presenterInbox.NextMatchingAsync(state => state.Phase == Phase.Quiz);
        await facilitatorInbox.NextMatchingAsync(state => state.Phase == Phase.Quiz);
    }

    [Fact]
    public async Task A_refused_intent_is_reported_to_the_caller_and_changes_nothing()
    {
        var sessionIdentity = await SeededSession(Phase.FinalPresentation);
        var (facilitator, inbox) = await ConnectFacilitator(sessionIdentity, "olga");
        var stateOnConnect = await inbox.NextAsync();

        var result = await facilitator.InvokeAsync<IntentResult>(
            nameof(FacilitatorHub.AdvancePhase)
        );

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.InvariantViolated);
        (await LoadSession(sessionIdentity)).Revision.ShouldBe(stateOnConnect.Revision);
    }

    [Fact]
    public async Task A_reconnecting_participant_resumes_its_place_and_is_pushed_the_state_again()
    {
        var sessionIdentity = await SeededSession();
        var (firstConnection, firstInbox) = await ConnectParticipant(sessionIdentity, "anna");
        await firstInbox.NextAsync();
        await firstConnection.StopAsync();

        var (_, secondInbox) = await ConnectParticipant(sessionIdentity, "anna");

        var state = await secondInbox.NextAsync();
        state.ParticipantCount.ShouldBe(1);
        state.Phase.ShouldBe(Phase.Join);
    }

    [Fact]
    public async Task The_latest_state_is_resent_so_a_dropped_message_heals_itself()
    {
        var sessionIdentity = await SeededSession();
        var (_, inbox) = await ConnectPresenter(sessionIdentity);

        var onConnect = await inbox.NextAsync();
        var resent = await inbox.NextAsync();

        resent.Revision.ShouldBe(onConnect.Revision);
        resent.Phase.ShouldBe(onConnect.Phase);
    }

    [Fact]
    public async Task Two_participants_each_receive_their_own_state()
    {
        var sessionIdentity = await SeededSession();
        var (_, annaInbox) = await ConnectParticipant(sessionIdentity, "anna");
        await annaInbox.NextAsync();

        var (_, benInbox) = await ConnectParticipant(sessionIdentity, "ben");

        await benInbox.NextMatchingAsync(state => state.ParticipantCount == 2);
        await annaInbox.NextMatchingAsync(state => state.ParticipantCount == 2);
    }

    [Fact]
    public async Task The_participant_hub_refuses_an_unauthenticated_connection()
    {
        var sessionIdentity = await SeededSession();
        var connection = HubConnectionFor("participant", sessionIdentity, token: null);

        await Should.ThrowAsync<HttpRequestException>(() => connection.StartAsync());
    }

    [Fact]
    public async Task Connecting_to_an_unknown_session_closes_the_connection_with_that_reason()
    {
        var connection = HubConnectionFor(
            "presenter",
            new SessionIdentity(Guid.NewGuid()),
            token: null
        );
        var closed = new TaskCompletionSource<Exception?>();
        connection.Closed += reason =>
        {
            closed.TrySetResult(reason);
            return Task.CompletedTask;
        };

        await connection.StartAsync();

        var reason = await closed.Task.WaitAsync(TimeSpan.FromSeconds(10));
        reason.ShouldBeOfType<HubException>().Message.ShouldContain("No session exists");
    }

    public Task InitializeAsync()
    {
        return Task.CompletedTask;
    }

    public async Task DisposeAsync()
    {
        foreach (var connection in connections)
        {
            await connection.DisposeAsync();
        }
    }

    private async Task<SessionIdentity> SeededSession(Phase phase = Phase.Join)
    {
        var sessionIdentity = new SessionIdentity(Guid.NewGuid());
        var session = TestSessions.Open(sessionIdentity);

        while (session.PhaseProgress.CurrentPhase != phase)
        {
            session.AdvancePhase();
        }

        using var scope = factory.Services.CreateScope();
        await scope.ServiceProvider.GetRequiredService<ISessionRepository>().CreateAsync(session);

        return sessionIdentity;
    }

    private async Task<Session> LoadSession(SessionIdentity sessionIdentity)
    {
        using var scope = factory.Services.CreateScope();
        var session = await scope
            .ServiceProvider.GetRequiredService<ISessionRepository>()
            .LoadAsync(sessionIdentity);

        return session.ShouldNotBeNull();
    }

    private Task<(HubConnection, StateInbox<ParticipantWorkshopState>)> ConnectParticipant(
        SessionIdentity sessionIdentity,
        string subject
    )
    {
        return Connect<ParticipantWorkshopState>(
            "participant",
            sessionIdentity,
            WorkshopTestFactory.TokenFor(subject)
        );
    }

    private Task<(HubConnection, StateInbox<FacilitatorWorkshopState>)> ConnectFacilitator(
        SessionIdentity sessionIdentity,
        string subject
    )
    {
        return Connect<FacilitatorWorkshopState>(
            "facilitator",
            sessionIdentity,
            WorkshopTestFactory.TokenFor(subject)
        );
    }

    private Task<(HubConnection, StateInbox<PresenterWorkshopState>)> ConnectPresenter(
        SessionIdentity sessionIdentity
    )
    {
        return Connect<PresenterWorkshopState>("presenter", sessionIdentity, token: null);
    }

    private async Task<(HubConnection, StateInbox<TState>)> Connect<TState>(
        string role,
        SessionIdentity sessionIdentity,
        string? token
    )
    {
        var connection = HubConnectionFor(role, sessionIdentity, token);
        var inbox = new StateInbox<TState>(connection);

        await connection.StartAsync();

        return (connection, inbox);
    }

    private HubConnection HubConnectionFor(
        string role,
        SessionIdentity sessionIdentity,
        string? token
    )
    {
        var server = factory.Server;

        var connection = new HubConnectionBuilder()
            .WithUrl(
                new Uri(server.BaseAddress, $"/hub/{role}?sessionIdentity={sessionIdentity.Value}"),
                options =>
                {
                    options.HttpMessageHandlerFactory = _ => server.CreateHandler();
                    options.Transports = HttpTransportType.LongPolling;

                    if (token is not null)
                    {
                        options.AccessTokenProvider = () => Task.FromResult<string?>(token);
                    }
                }
            )
            .Build();

        connections.Add(connection);

        return connection;
    }
}
