using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

internal static class VotingViews
{
    internal static ParticipantVotingView ForParticipant(
        Session session,
        ParticipantId caller,
        GroupViews groupViews
    )
    {
        return new ParticipantVotingView(
            session.Voting.RoundNumber,
            session.Voting.Allotment,
            EligibleValuesOf(session, groupViews),
            session.Voting.RoundOpen,
            session.Voting.HasVoted(caller)
        );
    }

    internal static FacilitatorVotingView ForFacilitator(Session session, GroupViews groupViews)
    {
        var lastClosedRound = session.Voting.LastClosedRound;

        return new FacilitatorVotingView(
            session.Voting.RoundNumber,
            session.Voting.Allotment,
            PresentedValuesOf(session, groupViews),
            session.Voting.RoundOpen,
            session.Voting.VotedCount,
            session.Roster.Participants.Count,
            lastClosedRound?.Tallies.ToDictionary(tally => tally.Key.Value, tally => tally.Value),
            lastClosedRound is { TiedValues.Count: > 0 }
                ? SessionViews.ValueIdsOf(lastClosedRound.TiedValues)
                : null
        );
    }

    internal static PresenterVotingView ForPresenter(Session session)
    {
        return new PresenterVotingView(session.Voting.RoundOpen);
    }

    private static IReadOnlyList<EligibleValueView> EligibleValuesOf(
        Session session,
        GroupViews groupViews
    )
    {
        return session
            .Voting.EligibleValues.Select(valueId => new EligibleValueView(
                valueId.Value,
                groupViews.ValueViewOf(valueId).Text,
                SessionViews.ActionTextsOf(session, valueId)
            ))
            .ToList();
    }

    private static IReadOnlyList<WorkshopValueView> PresentedValuesOf(
        Session session,
        GroupViews groupViews
    )
    {
        return SessionViews
            .Groups(session)
            .SelectMany(group => group.AssignedValues)
            .Select(groupViews.ValueViewOf)
            .ToList();
    }
}
