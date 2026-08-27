using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

internal static class SessionViews
{
    internal static RosterView Roster(Session session)
    {
        var participants = session
            .Roster.Participants.Select(participant => new RosterParticipantView(
                participant.Id.Value,
                participant.Name.Value
            ))
            .ToList();

        return new RosterView(participants, participants.Count);
    }

    internal static IReadOnlyList<string> ParticipantDisplayNames(Session session)
    {
        return session.Roster.Participants.Select(participant => participant.Name.Value).ToList();
    }

    internal static string DisplayNameOf(Session session, ParticipantId participantId)
    {
        var name =
            session.Roster.Find(participantId)?.Name ?? ParticipantName.Of(null, participantId);

        return name.Value;
    }

    internal static IReadOnlyList<Group> Groups(Session session)
    {
        return session.Formation.IsFormed ? session.Formation.Groups : [];
    }

    internal static string? PresentedValueId(Session session)
    {
        return session.Presentation.PresentedValue?.Value;
    }

    internal static PresentationView Presentation(Session session)
    {
        return new PresentationView(
            session.Presentation.PresentingGroup,
            PresentedValueId(session),
            ValuePresentation
                .PresentedActionsOf(session)
                .Select(action => new PresentedActionView(action.ActionId.Value, action.Text.Value))
                .ToList()
        );
    }

    internal static PresenterPresentationView PresenterPresentation(Session session)
    {
        return new PresenterPresentationView(
            session.Presentation.PresentingGroup,
            PresentedValueId(session),
            ValuePresentation
                .PresentedActionsOf(session)
                .Select(action => new PresenterPresentedActionView(action.Text.Value))
                .ToList()
        );
    }

    internal static ParticipantVotingView Voting(Session session, ParticipantId caller)
    {
        return new ParticipantVotingView(
            session.Voting.RoundNumber,
            session.Voting.Allotment,
            ValueIdsOf(session.Voting.EligibleValues),
            session.Voting.RoundOpen,
            session.Voting.HasVoted(caller)
        );
    }

    internal static FacilitatorVotingView FacilitatorVoting(Session session)
    {
        var lastClosedRound = session.Voting.LastClosedRound;

        return new FacilitatorVotingView(
            session.Voting.RoundNumber,
            session.Voting.Allotment,
            ValueIdsOf(session.Voting.EligibleValues),
            session.Voting.RoundOpen,
            session.Voting.VotedCount,
            lastClosedRound?.Tallies.ToDictionary(tally => tally.Key.Value, tally => tally.Value),
            lastClosedRound is { TiedValues.Count: > 0 }
                ? ValueIdsOf(lastClosedRound.TiedValues)
                : null
        );
    }

    internal static PresenterVotingView PresenterVoting(Session session)
    {
        return new PresenterVotingView(session.Voting.RoundOpen);
    }

    internal static ConclusionView Conclusion(Session session)
    {
        return new ConclusionView(ValueIdsOf(session.Voting.WinningValues));
    }

    internal static IReadOnlyList<string> ValueIdsOf(IEnumerable<ValueId> values)
    {
        return values.Select(value => value.Value).ToList();
    }
}
