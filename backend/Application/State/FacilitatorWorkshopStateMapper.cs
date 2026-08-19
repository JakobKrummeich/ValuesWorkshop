using ValuesWorkshop.Application.Ports.Driven;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

public sealed class FacilitatorWorkshopStateMapper(
    IQuizCatalog quizCatalog,
    IValuesCatalog valuesCatalog,
    IAnimalsCatalog animalsCatalogPort,
    PhaseExitGuards exitGuards
)
{
    private delegate FacilitatorWorkshopState StateFactory(
        Session session,
        long revision,
        IReadOnlyList<FacilitatorIntent> enabledIntents
    );

    private readonly IReadOnlyDictionary<Phase, StateFactory> stateOfPhase = BuildStateMap(
        quizCatalog,
        SelectionViews.CatalogOf(valuesCatalog),
        new GroupViews(animalsCatalogPort, valuesCatalog)
    );

    public FacilitatorWorkshopState Map(Session session, long revision)
    {
        var enabledIntents = FacilitatorEnabledIntents.Of(
            session,
            exitGuards,
            quizCatalog.Questions.Count
        );

        return stateOfPhase[session.PhaseProgress.CurrentPhase](session, revision, enabledIntents);
    }

    private static IReadOnlyDictionary<Phase, StateFactory> BuildStateMap(
        IQuizCatalog quizCatalog,
        IReadOnlyList<WorkshopValueView> catalogView,
        GroupViews groupViews
    )
    {
        return new Dictionary<Phase, StateFactory>
        {
            [Phase.Join] = (session, revision, enabledIntents) =>
                new FacilitatorJoinState(revision, SessionViews.Roster(session), enabledIntents),
            [Phase.Quiz] = (session, revision, enabledIntents) =>
                new FacilitatorQuizState(
                    revision,
                    SessionViews.Roster(session),
                    enabledIntents,
                    QuizViews.ForFacilitator(session, quizCatalog)
                ),
            [Phase.ValueSelection] = (session, revision, enabledIntents) =>
                new FacilitatorValueSelectionState(
                    revision,
                    SessionViews.Roster(session),
                    enabledIntents,
                    SelectionViews.Progress(session, catalogView)
                ),
            [Phase.SelectionResults] = (session, revision, enabledIntents) =>
                new FacilitatorSelectionResultsState(
                    revision,
                    SessionViews.Roster(session),
                    enabledIntents,
                    SelectionViews.ProgressWithResults(session, catalogView)
                ),
            [Phase.GroupFormation] = (session, revision, enabledIntents) =>
                new FacilitatorGroupFormationState(
                    revision,
                    SessionViews.Roster(session),
                    enabledIntents,
                    SelectionViews.Progress(session, catalogView),
                    Groups(session, groupViews)
                ),
            [Phase.GroupWork] = (session, revision, enabledIntents) =>
                new FacilitatorGroupWorkState(
                    revision,
                    SessionViews.Roster(session),
                    enabledIntents,
                    Groups(session, groupViews)
                ),
            [Phase.ValuePresentation] = (session, revision, enabledIntents) =>
                new FacilitatorValuePresentationState(
                    revision,
                    SessionViews.Roster(session),
                    enabledIntents,
                    Groups(session, groupViews),
                    SessionViews.Presentation(session)
                ),
            [Phase.FinalVoting] = (session, revision, enabledIntents) =>
                new FacilitatorFinalVotingState(
                    revision,
                    SessionViews.Roster(session),
                    enabledIntents,
                    SessionViews.Voting(session)
                ),
            [Phase.FinalPresentation] = (session, revision, enabledIntents) =>
                new FacilitatorFinalPresentationState(
                    revision,
                    SessionViews.Roster(session),
                    enabledIntents,
                    SessionViews.Conclusion(session)
                ),
        };
    }

    private static IReadOnlyList<FacilitatorGroupView> Groups(
        Session session,
        GroupViews groupViews
    )
    {
        return SessionViews
            .Groups(session)
            .Select(group => new FacilitatorGroupView(
                groupViews.NameOf(group),
                groupViews.MembersOf(group, session),
                groupViews.AssignedValuesOf(group)
            ))
            .ToList();
    }
}
