using ValuesWorkshop.Application.Ports.Driven;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

public sealed class PresenterWorkshopStateMapper(
    IQuizCatalog quizCatalog,
    IValuesCatalog valuesCatalog
)
{
    private readonly IReadOnlyDictionary<
        Phase,
        Func<Session, long, PresenterWorkshopState>
    > stateOfPhase = BuildStateMap(quizCatalog, SelectionViews.CatalogOf(valuesCatalog));

    public PresenterWorkshopState Map(Session session, long revision)
    {
        return stateOfPhase[session.PhaseProgress.CurrentPhase](session, revision);
    }

    private static IReadOnlyDictionary<
        Phase,
        Func<Session, long, PresenterWorkshopState>
    > BuildStateMap(IQuizCatalog quizCatalog, IReadOnlyList<WorkshopValueView> catalogView)
    {
        return new Dictionary<Phase, Func<Session, long, PresenterWorkshopState>>
        {
            [Phase.Join] = (session, revision) =>
                new PresenterJoinState(
                    revision,
                    ParticipantCount(session),
                    SessionViews.ParticipantDisplayNames(session)
                ),
            [Phase.Quiz] = (session, revision) =>
                new PresenterQuizState(
                    revision,
                    ParticipantCount(session),
                    QuizViews.ForPresenter(session, quizCatalog)
                ),
            [Phase.ValueSelection] = (session, revision) =>
                new PresenterValueSelectionState(
                    revision,
                    ParticipantCount(session),
                    SelectionViews.Progress(session, catalogView)
                ),
            [Phase.SelectionResults] = (session, revision) =>
                new PresenterSelectionResultsState(
                    revision,
                    ParticipantCount(session),
                    SelectionViews.ProgressWithResults(session, catalogView)
                ),
            [Phase.GroupFormation] = (session, revision) =>
                new PresenterGroupFormationState(
                    revision,
                    ParticipantCount(session),
                    SelectionViews.Progress(session, catalogView),
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
