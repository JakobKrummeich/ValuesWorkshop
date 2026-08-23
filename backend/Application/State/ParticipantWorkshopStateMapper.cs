using ValuesWorkshop.Application.Formation;
using ValuesWorkshop.Application.Ports.Driven;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

public sealed class ParticipantWorkshopStateMapper(
    IQuizCatalog quizCatalog,
    IValuesCatalog valuesCatalog,
    IAnimalsCatalog animalsCatalogPort,
    IGroupFormationProgress formationProgressPort
)
{
    private readonly IReadOnlyDictionary<
        Phase,
        Func<Session, ParticipantId, long, ParticipantWorkshopState>
    > stateOfPhase = BuildStateMap(
        quizCatalog,
        SelectionViews.CatalogOf(valuesCatalog),
        new GroupViews(animalsCatalogPort, valuesCatalog),
        formationProgressPort
    );

    public ParticipantWorkshopState MapFor(Session session, ParticipantId caller, long revision)
    {
        return stateOfPhase[session.PhaseProgress.CurrentPhase](session, caller, revision);
    }

    private static IReadOnlyDictionary<
        Phase,
        Func<Session, ParticipantId, long, ParticipantWorkshopState>
    > BuildStateMap(
        IQuizCatalog quizCatalog,
        IReadOnlyList<WorkshopValueView> catalogView,
        GroupViews groupViews,
        IGroupFormationProgress formationProgressPort
    )
    {
        return new Dictionary<Phase, Func<Session, ParticipantId, long, ParticipantWorkshopState>>
        {
            [Phase.Join] = (session, caller, revision) =>
                new ParticipantJoinState(
                    revision,
                    ParticipantCount(session),
                    SessionViews.DisplayNameOf(session, caller)
                ),
            [Phase.Quiz] = (session, caller, revision) =>
                new ParticipantQuizState(
                    revision,
                    ParticipantCount(session),
                    QuizViews.ForParticipant(session, caller, quizCatalog)
                ),
            [Phase.ValueSelection] = (session, caller, revision) =>
                new ParticipantValueSelectionState(
                    revision,
                    ParticipantCount(session),
                    SelectionViews.ForParticipant(session, caller, catalogView)
                ),
            [Phase.SelectionResults] = (session, caller, revision) =>
                new ParticipantSelectionResultsState(
                    revision,
                    ParticipantCount(session),
                    SelectionViews.ForParticipantWithResults(session, caller, catalogView)
                ),
            [Phase.GroupFormation] = (session, caller, revision) =>
                new ParticipantGroupFormationState(
                    revision,
                    ParticipantCount(session),
                    session.Formation.IsFormed
                        ? new ParticipantFormedView(OwnGroupOnceFormed(session, caller, groupViews))
                        : new ParticipantFormingView(
                            formationProgressPort.ProgressOf(session.Identity).Value
                        )
                ),
            [Phase.GroupWork] = (session, caller, revision) =>
                new ParticipantGroupWorkState(
                    revision,
                    ParticipantCount(session),
                    OwnGroup(session, caller, groupViews)
                ),
            [Phase.ValuePresentation] = (session, caller, revision) =>
                new ParticipantValuePresentationState(
                    revision,
                    ParticipantCount(session),
                    OwnGroup(session, caller, groupViews),
                    SessionViews.Presentation(session)
                ),
            [Phase.FinalVoting] = (session, _, revision) =>
                new ParticipantFinalVotingState(
                    revision,
                    ParticipantCount(session),
                    SessionViews.Voting(session)
                ),
            [Phase.FinalPresentation] = (session, _, revision) =>
                new ParticipantFinalPresentationState(
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

    private static OwnGroupView OwnGroupOnceFormed(
        Session session,
        ParticipantId caller,
        GroupViews groupViews
    )
    {
        return OwnGroup(session, caller, groupViews)
            ?? throw new InvalidOperationException(
                "Once the groups stand, every participant belongs to one of them."
            );
    }

    private static OwnGroupView? OwnGroup(
        Session session,
        ParticipantId caller,
        GroupViews groupViews
    )
    {
        var ownGroup = SessionViews
            .Groups(session)
            .SingleOrDefault(group => group.Members.Contains(caller));

        if (ownGroup is null)
        {
            return null;
        }

        return new OwnGroupView(
            groupViews.NameOf(ownGroup),
            groupViews.MemberDisplayNamesOf(ownGroup, session),
            groupViews.AssignedValuesOf(ownGroup),
            groupViews.IsCallerScribeOf(ownGroup, session, caller),
            groupViews.ScribeNameOf(ownGroup, session),
            groupViews.WorkStatusOf(ownGroup, session),
            groupViews.ActionsOf(ownGroup, session)
        );
    }
}
