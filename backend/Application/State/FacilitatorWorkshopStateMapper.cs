using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

public static class FacilitatorWorkshopStateMapper
{
    public static FacilitatorWorkshopState Map(Session session, long revision)
    {
        return new FacilitatorWorkshopState(
            revision,
            session.PhaseProgress.CurrentPhase,
            MapRoster(session),
            SessionViews.Quiz(session),
            SessionViews.SelectionProgress(session),
            MapGroups(session),
            SessionViews.Presentation(session),
            SessionViews.Voting(session),
            SessionViews.Conclusion(session)
        );
    }

    private static RosterView MapRoster(Session session)
    {
        var participantIds = session
            .Roster.Participants.Select(participant => participant.Value)
            .ToList();

        return new RosterView(participantIds, participantIds.Count);
    }

    private static IReadOnlyList<FacilitatorGroupView>? MapGroups(Session session)
    {
        return SessionViews
            .Groups(session)
            ?.Select(group => new FacilitatorGroupView(
                group.Name,
                group.Members.Select(member => member.Value).ToList(),
                SessionViews.ValueIdsOf(group.AssignedValues),
                group.Scribe?.Value,
                SessionViews.WorkStatusOf(group)
            ))
            .ToList();
    }
}
