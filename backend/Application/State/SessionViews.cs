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
            PresentedValueId(session)
        );
    }

    internal static VotingView Voting(Session session)
    {
        return new VotingView(session.Voting.RoundNumber, session.Voting.RoundOpen);
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
