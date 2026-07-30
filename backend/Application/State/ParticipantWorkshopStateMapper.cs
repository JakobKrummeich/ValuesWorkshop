using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

public static class ParticipantWorkshopStateMapper
{
    public static ParticipantWorkshopState MapFor(
        Session session,
        ParticipantId caller,
        long revision
    )
    {
        return new ParticipantWorkshopState(
            revision,
            session.PhaseProgress.CurrentPhase,
            session.Roster.Participants.Count,
            SessionViews.Quiz(session),
            MapSelection(session, caller),
            MapOwnGroup(session, caller),
            SessionViews.Presentation(session),
            SessionViews.Voting(session),
            SessionViews.Conclusion(session)
        );
    }

    private static OwnSelectionView? MapSelection(Session session, ParticipantId caller)
    {
        if (!SessionViews.HasReachedSelection(session))
        {
            return null;
        }

        return new OwnSelectionView(
            session.Selection.SubmittedBy.Contains(caller),
            SessionViews.TopValueIds(session)
        );
    }

    private static OwnGroupView? MapOwnGroup(Session session, ParticipantId caller)
    {
        var ownGroup = SessionViews
            .Groups(session)
            ?.SingleOrDefault(group => group.Members.Contains(caller));

        if (ownGroup is null)
        {
            return null;
        }

        return new OwnGroupView(
            ownGroup.Name,
            ownGroup.Members.Count,
            SessionViews.ValueIdsOf(ownGroup.AssignedValues),
            ownGroup.Scribe == caller,
            SessionViews.WorkStatusOf(ownGroup)
        );
    }
}
