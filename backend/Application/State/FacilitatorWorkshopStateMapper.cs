using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

public static class FacilitatorWorkshopStateMapper
{
    private static readonly IReadOnlyDictionary<
        Phase,
        Func<Session, long, FacilitatorWorkshopState>
    > StateOfPhase = new Dictionary<Phase, Func<Session, long, FacilitatorWorkshopState>>
    {
        [Phase.Join] = (session, revision) =>
            new FacilitatorJoinState(revision, SessionViews.Roster(session)),
        [Phase.Quiz] = (session, revision) =>
            new FacilitatorQuizState(
                revision,
                SessionViews.Roster(session),
                SessionViews.Quiz(session)
            ),
        [Phase.ValueSelection] = (session, revision) =>
            new FacilitatorValueSelectionState(
                revision,
                SessionViews.Roster(session),
                SessionViews.SelectionProgress(session)
            ),
        [Phase.SelectionResults] = (session, revision) =>
            new FacilitatorSelectionResultsState(
                revision,
                SessionViews.Roster(session),
                SessionViews.SelectionProgress(session)
            ),
        [Phase.GroupFormation] = (session, revision) =>
            new FacilitatorGroupFormationState(
                revision,
                SessionViews.Roster(session),
                SessionViews.SelectionProgress(session),
                Groups(session)
            ),
        [Phase.GroupWork] = (session, revision) =>
            new FacilitatorGroupWorkState(revision, SessionViews.Roster(session), Groups(session)),
        [Phase.ValuePresentation] = (session, revision) =>
            new FacilitatorValuePresentationState(
                revision,
                SessionViews.Roster(session),
                Groups(session),
                SessionViews.Presentation(session)
            ),
        [Phase.FinalVoting] = (session, revision) =>
            new FacilitatorFinalVotingState(
                revision,
                SessionViews.Roster(session),
                SessionViews.Voting(session)
            ),
        [Phase.FinalPresentation] = (session, revision) =>
            new FacilitatorFinalPresentationState(
                revision,
                SessionViews.Roster(session),
                SessionViews.Conclusion(session)
            ),
    };

    public static FacilitatorWorkshopState Map(Session session, long revision)
    {
        return StateOfPhase[session.PhaseProgress.CurrentPhase](session, revision);
    }

    private static IReadOnlyList<FacilitatorGroupView> Groups(Session session)
    {
        return SessionViews
            .Groups(session)
            .Select(group => new FacilitatorGroupView(
                group.Name,
                group.Members.Select(member => member.Value).ToList(),
                SessionViews.ValueIdsOf(group.AssignedValues),
                group.Scribe?.Value,
                SessionViews.WorkStatusOf(group)
            ))
            .ToList();
    }
}
