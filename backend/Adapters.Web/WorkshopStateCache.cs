using System.Collections.Concurrent;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Web;

public sealed class WorkshopStateCache
{
    private readonly ConcurrentDictionary<SessionIdentity, SessionRoleStates> statesBySession =
        new();

    public SessionRoleStates StatesOf(Session session)
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

    private static SessionRoleStates MapAllRoles(Session session)
    {
        var participantStates = session.Roster.Participants.ToDictionary(
            participant => participant.Id,
            participant =>
                ParticipantWorkshopStateMapper.MapFor(session, participant.Id, session.Revision)
        );

        return new SessionRoleStates(
            session.Revision,
            FacilitatorWorkshopStateMapper.Map(session, session.Revision),
            PresenterWorkshopStateMapper.Map(session, session.Revision),
            participantStates
        );
    }
}
