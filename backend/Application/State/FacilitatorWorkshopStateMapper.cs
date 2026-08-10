using ValuesWorkshop.Application.Ports.Driven;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

public sealed class FacilitatorWorkshopStateMapper(
    IQuizCatalog quizCatalog,
    IValuesCatalog valuesCatalog,
    PhaseExitGuards exitGuards
)
{
    private delegate FacilitatorWorkshopState StateFactory(
        Session session,
        long revision,
        IReadOnlyList<FacilitatorIntent> enabledIntents
    );

    private readonly IReadOnlyDictionary<Phase, StateFactory> stateOfPhase = new Dictionary<
        Phase,
        StateFactory
    >
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
                SelectionViews.Progress(session, valuesCatalog)
            ),
        [Phase.SelectionResults] = (session, revision, enabledIntents) =>
            new FacilitatorSelectionResultsState(
                revision,
                SessionViews.Roster(session),
                enabledIntents,
                SelectionViews.Progress(session, valuesCatalog)
            ),
        [Phase.GroupFormation] = (session, revision, enabledIntents) =>
            new FacilitatorGroupFormationState(
                revision,
                SessionViews.Roster(session),
                enabledIntents,
                SelectionViews.Progress(session, valuesCatalog),
                Groups(session)
            ),
        [Phase.GroupWork] = (session, revision, enabledIntents) =>
            new FacilitatorGroupWorkState(
                revision,
                SessionViews.Roster(session),
                enabledIntents,
                Groups(session)
            ),
        [Phase.ValuePresentation] = (session, revision, enabledIntents) =>
            new FacilitatorValuePresentationState(
                revision,
                SessionViews.Roster(session),
                enabledIntents,
                Groups(session),
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

    public FacilitatorWorkshopState Map(Session session, long revision)
    {
        var enabledIntents = FacilitatorEnabledIntents.Of(
            session,
            exitGuards,
            quizCatalog.Questions.Count
        );

        return stateOfPhase[session.PhaseProgress.CurrentPhase](session, revision, enabledIntents);
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
