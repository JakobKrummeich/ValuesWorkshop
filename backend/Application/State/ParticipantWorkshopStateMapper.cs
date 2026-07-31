using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

public static class ParticipantWorkshopStateMapper
{
    private static readonly IReadOnlyDictionary<
        Phase,
        Func<Session, ParticipantId, long, ParticipantWorkshopState>
    > StateOfPhase = new Dictionary<
        Phase,
        Func<Session, ParticipantId, long, ParticipantWorkshopState>
    >
    {
        [Phase.Join] = (session, _, revision) =>
            new ParticipantJoinState(revision, ParticipantCount(session)),
        [Phase.Quiz] = (session, _, revision) =>
            new ParticipantQuizState(
                revision,
                ParticipantCount(session),
                SessionViews.Quiz(session)
            ),
        [Phase.ValueSelection] = (session, caller, revision) =>
            new ParticipantValueSelectionState(
                revision,
                ParticipantCount(session),
                OwnSelection(session, caller)
            ),
        [Phase.SelectionResults] = (session, caller, revision) =>
            new ParticipantSelectionResultsState(
                revision,
                ParticipantCount(session),
                OwnSelection(session, caller)
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

    public static ParticipantWorkshopState MapFor(
        Session session,
        ParticipantId caller,
        long revision
    )
    {
        return StateOfPhase[session.PhaseProgress.CurrentPhase](session, caller, revision);
    }

    private static int ParticipantCount(Session session)
    {
        return session.Roster.Participants.Count;
    }

    private static OwnSelectionView OwnSelection(Session session, ParticipantId caller)
    {
        return new OwnSelectionView(
            session.Selection.SubmittedBy.Contains(caller),
            SessionViews.TopValueIds(session)
        );
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
