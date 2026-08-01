using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

public static class PresenterWorkshopStateMapper
{
    private static readonly IReadOnlyDictionary<
        Phase,
        Func<Session, long, PresenterWorkshopState>
    > StateOfPhase = new Dictionary<Phase, Func<Session, long, PresenterWorkshopState>>
    {
        [Phase.Join] = (session, revision) =>
            new PresenterJoinState(revision, ParticipantCount(session)),
        [Phase.Quiz] = (session, revision) =>
            new PresenterQuizState(revision, ParticipantCount(session), SessionViews.Quiz(session)),
        [Phase.ValueSelection] = (session, revision) =>
            new PresenterValueSelectionState(
                revision,
                ParticipantCount(session),
                SessionViews.SelectionProgress(session)
            ),
        [Phase.SelectionResults] = (session, revision) =>
            new PresenterSelectionResultsState(
                revision,
                ParticipantCount(session),
                SessionViews.SelectionProgress(session)
            ),
        [Phase.GroupFormation] = (session, revision) =>
            new PresenterGroupFormationState(
                revision,
                ParticipantCount(session),
                SessionViews.SelectionProgress(session),
                Groups(session)
            ),
        [Phase.GroupWork] = (session, revision) =>
            new PresenterGroupWorkState(revision, ParticipantCount(session), Groups(session)),
        [Phase.ValuePresentation] = (session, revision) =>
            new PresenterValuePresentationState(
                revision,
                ParticipantCount(session),
                Groups(session),
                new PresenterPresentationView(SessionViews.PresentedValueId(session))
            ),
        [Phase.FinalVoting] = (session, revision) =>
            new PresenterFinalVotingState(
                revision,
                ParticipantCount(session),
                new PresenterVotingView(session.Voting.RoundOpen)
            ),
        [Phase.FinalPresentation] = (session, revision) =>
            new PresenterFinalPresentationState(
                revision,
                ParticipantCount(session),
                SessionViews.Conclusion(session)
            ),
    };

    public static PresenterWorkshopState Map(Session session, long revision)
    {
        return StateOfPhase[session.PhaseProgress.CurrentPhase](session, revision);
    }

    private static int ParticipantCount(Session session)
    {
        return session.Roster.Participants.Count;
    }

    private static IReadOnlyList<PresenterGroupView> Groups(Session session)
    {
        return SessionViews
            .Groups(session)
            .Select(group => new PresenterGroupView(
                group.Name,
                group.Members.Count,
                SessionViews.ValueIdsOf(group.AssignedValues),
                SessionViews.WorkStatusOf(group)
            ))
            .ToList();
    }
}
