using ValuesWorkshop.Adapters.Web;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Tests;

public class SignalRBroadcasterTests
{
    private static readonly SessionIdentity KnownSession = new(
        Guid.Parse("00000000-0000-0000-0000-00000000f00d")
    );

    private readonly RecordingHubClients<IFacilitatorClient> facilitatorClients = new();
    private readonly RecordingHubClients<IParticipantClient> participantClients = new();
    private readonly RecordingHubClients<IPresenterClient> presenterClients = new();

    [Fact]
    public async Task The_facilitator_and_presenter_groups_receive_their_own_state_shape()
    {
        var session = SessionWith(participantCount: 0);

        await BroadcasterUnderTest().BroadcastSessionStateAsync(session);

        facilitatorClients
            .GroupClient(SessionGroups.Facilitator(KnownSession))
            .Single<FacilitatorWorkshopState>()
            .Revision.ShouldBe(session.Revision);
        presenterClients
            .GroupClient(SessionGroups.Presenter(KnownSession))
            .Single<PresenterWorkshopState>()
            .Revision.ShouldBe(session.Revision);
    }

    [Fact]
    public async Task Every_participant_receives_their_own_state_in_their_own_group()
    {
        var session = SessionWith(participantCount: 3);

        await BroadcasterUnderTest().BroadcastSessionStateAsync(session);

        participantClients.AddressedGroups.ShouldBe(
            session
                .Roster.Participants.Select(participant =>
                    SessionGroups.Participant(KnownSession, participant.Id)
                )
                .ToList(),
            ignoreOrder: true
        );

        foreach (var participant in session.Roster.Participants)
        {
            participantClients
                .GroupClient(SessionGroups.Participant(KnownSession, participant.Id))
                .Single<ParticipantWorkshopState>()
                .ParticipantCount.ShouldBe(3);
        }
    }

    [Fact]
    public async Task A_session_without_participants_addresses_no_participant_group()
    {
        await BroadcasterUnderTest().BroadcastSessionStateAsync(SessionWith(participantCount: 0));

        participantClients.AddressedGroups.ShouldBeEmpty();
    }

    private static Session SessionWith(int participantCount)
    {
        var session = TestSessions.Open(KnownSession);

        for (var index = 0; index < participantCount; index++)
        {
            session.Join(
                TestParticipants.Unnamed(new ParticipantId(Guid.NewGuid())),
                new FixedRandomness(0)
            );
        }

        session.BumpRevision();

        return session;
    }

    private RoleStateDispatcher DispatcherUnderTest()
    {
        return new RoleStateDispatcher(
            new RecordingHubContext<FacilitatorHub, IFacilitatorClient>(facilitatorClients),
            new RecordingHubContext<ParticipantHub, IParticipantClient>(participantClients),
            new RecordingHubContext<PresenterHub, IPresenterClient>(presenterClients)
        );
    }

    private SignalRBroadcaster BroadcasterUnderTest()
    {
        return new SignalRBroadcaster(new WorkshopStateCache(), DispatcherUnderTest());
    }
}
