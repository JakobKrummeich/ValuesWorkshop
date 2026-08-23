using ValuesWorkshop.Application.Formation;
using ValuesWorkshop.Application.Ports.Driven;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

public sealed class PresenterWorkshopStateMapper(
    IQuizCatalog quizCatalog,
    IValuesCatalog valuesCatalog,
    IAnimalsCatalog animalsCatalogPort,
    IGroupFormationProgress formationProgressPort
)
{
    private readonly IReadOnlyDictionary<
        Phase,
        Func<Session, long, PresenterWorkshopState>
    > stateOfPhase = BuildStateMap(
        quizCatalog,
        SelectionViews.CatalogOf(valuesCatalog),
        new GroupViews(animalsCatalogPort, valuesCatalog),
        formationProgressPort
    );

    public PresenterWorkshopState Map(Session session, long revision)
    {
        return stateOfPhase[session.PhaseProgress.CurrentPhase](session, revision);
    }

    private static IReadOnlyDictionary<
        Phase,
        Func<Session, long, PresenterWorkshopState>
    > BuildStateMap(
        IQuizCatalog quizCatalog,
        IReadOnlyList<WorkshopValueView> catalogView,
        GroupViews groupViews,
        IGroupFormationProgress formationProgressPort
    )
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
                    session.Formation.IsFormed
                        ? new PresenterFormedView(Groups(session, groupViews))
                        : new PresenterFormingView(
                            formationProgressPort.ProgressOf(session.Identity)
                        )
                ),
            [Phase.GroupWork] = (session, revision) =>
                new PresenterGroupWorkState(
                    revision,
                    ParticipantCount(session),
                    Groups(session, groupViews)
                ),
            [Phase.ValuePresentation] = (session, revision) =>
                new PresenterValuePresentationState(
                    revision,
                    ParticipantCount(session),
                    Groups(session, groupViews),
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

    private static IReadOnlyList<PresenterGroupView> Groups(Session session, GroupViews groupViews)
    {
        return SessionViews
            .Groups(session)
            .Select(group => new PresenterGroupView(
                groupViews.NameOf(group),
                groupViews.MemberDisplayNamesOf(group, session),
                groupViews.AssignedValuesOf(group),
                groupViews.WorkStatusOf(group, session)
            ))
            .ToList();
    }
}
