using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

public static class PresenterWorkshopStateMapper
{
    public static PresenterWorkshopState Map(Session session, long revision)
    {
        return new PresenterWorkshopState(
            revision,
            session.PhaseProgress.CurrentPhase,
            session.Roster.Participants.Count,
            SessionViews.Quiz(session),
            SessionViews.SelectionProgress(session),
            MapGroups(session),
            MapPresentation(session),
            MapVoting(session),
            SessionViews.Conclusion(session)
        );
    }

    private static IReadOnlyList<PresenterGroupView>? MapGroups(Session session)
    {
        return SessionViews
            .Groups(session)
            ?.Select(group => new PresenterGroupView(
                group.Name,
                group.Members.Count,
                SessionViews.ValueIdsOf(group.AssignedValues),
                SessionViews.WorkStatusOf(group)
            ))
            .ToList();
    }

    private static PresenterPresentationView? MapPresentation(Session session)
    {
        var presentedValueId = SessionViews.PresentedValueId(session);

        return presentedValueId is null ? null : new PresenterPresentationView(presentedValueId);
    }

    private static PresenterVotingView? MapVoting(Session session)
    {
        return SessionViews.HasReachedVoting(session)
            ? new PresenterVotingView(session.Voting.RoundOpen)
            : null;
    }
}
