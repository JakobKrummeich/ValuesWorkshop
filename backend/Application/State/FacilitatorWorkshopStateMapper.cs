using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

public static class FacilitatorWorkshopStateMapper
{
    private static readonly IReadOnlyDictionary<
        Phase,
        Func<Session, long, FacilitatorWorkshopState>
    > StateOfPhase = new Dictionary<Phase, Func<Session, long, FacilitatorWorkshopState>>
    {
        [Phase.Join] = (session, revision) => new FacilitatorJoinState(revision, Roster(session)),
        [Phase.Quiz] = (session, revision) =>
            new FacilitatorQuizState(revision, Roster(session), SessionViews.Quiz(session)),
        [Phase.ValueSelection] = (session, revision) =>
            new FacilitatorValueSelectionState(
                revision,
                Roster(session),
                SessionViews.SelectionProgress(session)
            ),
        [Phase.SelectionResults] = (session, revision) =>
            new FacilitatorSelectionResultsState(
                revision,
                Roster(session),
                SessionViews.SelectionProgress(session)
            ),
        [Phase.GroupFormation] = (session, revision) =>
            new FacilitatorGroupFormationState(
                revision,
                Roster(session),
                SessionViews.SelectionProgress(session),
                Groups(session)
            ),
        [Phase.GroupWork] = (session, revision) =>
            new FacilitatorGroupWorkState(revision, Roster(session), Groups(session)),
        [Phase.ValuePresentation] = (session, revision) =>
            new FacilitatorValuePresentationState(
                revision,
                Roster(session),
                Groups(session),
                SessionViews.Presentation(session)
            ),
        [Phase.FinalVoting] = (session, revision) =>
            new FacilitatorFinalVotingState(
                revision,
                Roster(session),
                SessionViews.Voting(session)
            ),
        [Phase.FinalPresentation] = (session, revision) =>
            new FacilitatorFinalPresentationState(
                revision,
                Roster(session),
                SessionViews.Conclusion(session)
            ),
    };

    public static FacilitatorWorkshopState Map(Session session, long revision)
    {
        return StateOfPhase[session.PhaseProgress.CurrentPhase](session, revision);
    }

    private static RosterView Roster(Session session)
    {
        var participantIds = session
            .Roster.Participants.Select(participant => participant.Value)
            .ToList();

        return new RosterView(participantIds, participantIds.Count);
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
