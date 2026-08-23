using System.Collections.Concurrent;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Web;

public sealed class WorkshopStateCache(
    FacilitatorWorkshopStateMapper facilitatorStateMapper,
    PresenterWorkshopStateMapper presenterStateMapper,
    ParticipantWorkshopStateMapper participantStateMapper
)
{
    private readonly ConcurrentDictionary<SessionIdentity, SessionRoleStates> statesBySession =
        new();

    public SessionRoleStates StatesOf(Session session)
    {
        return session.IsFormingGroups ? MapWithoutCaching(session) : MapAndCache(session);
    }

    public SessionRoleStates? LatestOf(SessionIdentity sessionIdentity)
    {
        return statesBySession.GetValueOrDefault(sessionIdentity);
    }

    public void RetainOnly(IReadOnlyCollection<SessionIdentity> sessionIdentities)
    {
        foreach (var sessionIdentity in statesBySession.Keys)
        {
            if (!sessionIdentities.Contains(sessionIdentity))
            {
                statesBySession.TryRemove(sessionIdentity, out _);
            }
        }
    }

    private SessionRoleStates MapWithoutCaching(Session session)
    {
        statesBySession.TryRemove(session.Identity, out _);

        return MapAllRoles(session);
    }

    private SessionRoleStates MapAndCache(Session session)
    {
        var cached = LatestOf(session.Identity);

        if (cached?.Revision == session.Revision)
        {
            return cached;
        }

        var mapped = MapAllRoles(session);

        return statesBySession.AddOrUpdate(
            session.Identity,
            _ => mapped,
            (_, existing) => existing.Revision >= mapped.Revision ? existing : mapped
        );
    }

    private SessionRoleStates MapAllRoles(Session session)
    {
        var participantStates = session.Roster.Participants.ToDictionary(
            participant => participant.Id,
            participant => participantStateMapper.MapFor(session, participant.Id, session.Revision)
        );

        return new SessionRoleStates(
            session.Revision,
            facilitatorStateMapper.Map(session, session.Revision),
            presenterStateMapper.Map(session, session.Revision),
            participantStates
        );
    }
}
