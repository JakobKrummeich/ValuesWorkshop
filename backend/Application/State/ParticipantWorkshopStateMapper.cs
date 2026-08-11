using ValuesWorkshop.Application.Ports.Driven;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

public sealed class ParticipantWorkshopStateMapper(
    IQuizCatalog quizCatalog,
    IValuesCatalog valuesCatalog
)
{
    private readonly IReadOnlyDictionary<
        Phase,
        Func<Session, ParticipantId, long, ParticipantWorkshopState>
    > stateOfPhase = BuildStateMap(quizCatalog, SelectionViews.CatalogOf(valuesCatalog));

    public ParticipantWorkshopState MapFor(Session session, ParticipantId caller, long revision)
    {
        return stateOfPhase[session.PhaseProgress.CurrentPhase](session, caller, revision);
    }

    private static IReadOnlyDictionary<
        Phase,
        Func<Session, ParticipantId, long, ParticipantWorkshopState>
    > BuildStateMap(IQuizCatalog quizCatalog, IReadOnlyList<WorkshopValueView> catalogView)
    {
        return new Dictionary<Phase, Func<Session, ParticipantId, long, ParticipantWorkshopState>>
        {
            [Phase.Join] = (session, caller, revision) =>
                new ParticipantJoinState(
                    revision,
                    ParticipantCount(session),
                    OwnDisplayName(session, caller)
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
                    SelectionViews.ForParticipant(session, caller, catalogView)
                ),
            [Phase.GroupFormation] = (session, caller, revision) =>
                new ParticipantGroupFormationState(
                    revision,
                    ParticipantCount(session),
                    OwnGroup(session, caller)
                ),
            [Phase.GroupWork] = (session, caller, revision) =>
                new ParticipantGroupWorkState(
                    revision,
                    ParticipantCount(session),
                    OwnGroup(session, caller)
                ),
            [Phase.ValuePresentation] = (session, caller, revision) =>
                new ParticipantValuePresentationState(
                    revision,
                    ParticipantCount(session),
                    OwnGroup(session, caller),
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

    private static string OwnDisplayName(Session session, ParticipantId caller)
    {
        var name = session.Roster.Find(caller)?.Name ?? ParticipantName.Of(null, caller);

        return name.Value;
    }

    private static OwnGroupView? OwnGroup(Session session, ParticipantId caller)
    {
        var ownGroup = SessionViews
            .Groups(session)
            .SingleOrDefault(group => group.Members.Contains(caller));

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
