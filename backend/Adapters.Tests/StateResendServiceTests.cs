using Microsoft.Extensions.Logging.Abstractions;
using ValuesWorkshop.Adapters.Web;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Tests;

public class StateResendServiceTests
{
    private static readonly SessionIdentity KnownSession = new(
        Guid.Parse("00000000-0000-0000-0000-00000000f00d")
    );

    private readonly WorkshopStateCache cache = new();
    private readonly SessionConnectionRegistry registry = new();
    private readonly RecordingHubClients<IFacilitatorClient> facilitatorClients = new();
    private readonly RecordingHubClients<IParticipantClient> participantClients = new();
    private readonly RecordingHubClients<IPresenterClient> presenterClients = new();

    [Fact]
    public async Task A_connected_session_receives_its_latest_state_again()
    {
        var session = SessionWithOneParticipant();
        cache.StatesOf(session);
        registry.Add(KnownSession, "connection-1");

        await ServiceUnderTest().ResendOnceAsync();

        facilitatorClients
            .GroupClient(SessionGroups.Facilitator(KnownSession))
            .Single<FacilitatorWorkshopState>()
            .Revision.ShouldBe(session.Revision);
        presenterClients
            .GroupClient(SessionGroups.Presenter(KnownSession))
            .Single<PresenterWorkshopState>()
            .Revision.ShouldBe(session.Revision);
        participantClients
            .GroupClient(SessionGroups.Participant(KnownSession, session.Roster.Participants[0]))
            .Single<ParticipantWorkshopState>()
            .Revision.ShouldBe(session.Revision);
    }

    [Fact]
    public async Task A_session_nobody_is_connected_to_is_skipped_and_forgotten()
    {
        cache.StatesOf(SessionWithOneParticipant());

        await ServiceUnderTest().ResendOnceAsync();

        facilitatorClients.AddressedGroups.ShouldBeEmpty();
        presenterClients.AddressedGroups.ShouldBeEmpty();
        cache.LatestOf(KnownSession).ShouldBeNull();
    }

    [Fact]
    public async Task A_connected_session_without_a_known_state_sends_nothing()
    {
        registry.Add(KnownSession, "connection-1");

        await ServiceUnderTest().ResendOnceAsync();

        facilitatorClients.AddressedGroups.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_session_whose_last_connection_left_is_no_longer_resent()
    {
        cache.StatesOf(SessionWithOneParticipant());
        registry.Add(KnownSession, "connection-1");
        registry.Remove("connection-1");

        await ServiceUnderTest().ResendOnceAsync();

        facilitatorClients.AddressedGroups.ShouldBeEmpty();
    }

    private static Session SessionWithOneParticipant()
    {
        var session = new Session(KnownSession);
        session.Join(new ParticipantId(Guid.NewGuid()), new FixedRandomness(0));
        session.BumpRevision();

        return session;
    }

    private StateResendService ServiceUnderTest()
    {
        return new StateResendService(
            registry,
            cache,
            new RoleStateDispatcher(
                new RecordingHubContext<FacilitatorHub, IFacilitatorClient>(facilitatorClients),
                new RecordingHubContext<ParticipantHub, IParticipantClient>(participantClients),
                new RecordingHubContext<PresenterHub, IPresenterClient>(presenterClients)
            ),
            new StateResendInterval(TimeSpan.FromMilliseconds(500)),
            NullLogger<StateResendService>.Instance
        );
    }
}
