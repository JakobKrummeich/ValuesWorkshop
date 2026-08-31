using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

internal static class ConclusionViews
{
    internal static ParticipantConclusionView ForParticipant(Session session, GroupViews groupViews)
    {
        return new ParticipantConclusionView(
            session.Reveal.IsConcluded,
            session.Reveal.IsConcluded ? RecordOf(session, groupViews) : null
        );
    }

    internal static FacilitatorConclusionView ForFacilitator(Session session, GroupViews groupViews)
    {
        var winners = session
            .Voting.RankedWinners.Select(winner => new WinnerView(
                winner.ValueId.Value,
                groupViews.ValueViewOf(winner.ValueId).Text,
                winner.Place,
                winner.VoteCount
            ))
            .ToList();

        return new FacilitatorConclusionView(
            winners,
            session.Reveal.RevealedCount,
            session.Reveal.IsConcluded
        );
    }

    internal static PresenterConclusionView ForPresenter(Session session, GroupViews groupViews)
    {
        var revealedWinners = session
            .Voting.RankedWinners.OrderByDescending(winner => winner.Place)
            .Take(session.Reveal.RevealedCount)
            .Select(winner => RankedWinnerViewOf(session, groupViews, winner))
            .ToList();

        return new PresenterConclusionView(revealedWinners, session.Reveal.IsConcluded);
    }

    private static WorkshopRecordView RecordOf(Session session, GroupViews groupViews)
    {
        var winners = session
            .Voting.RankedWinners.Select(winner => RankedWinnerViewOf(session, groupViews, winner))
            .ToList();

        return new WorkshopRecordView(
            winners,
            PresentedValuesOf(session, groupViews),
            RoundsOf(session)
        );
    }

    private static RankedWinnerView RankedWinnerViewOf(
        Session session,
        GroupViews groupViews,
        RankedWinner winner
    )
    {
        return new RankedWinnerView(
            winner.ValueId.Value,
            groupViews.ValueViewOf(winner.ValueId).Text,
            winner.Place,
            winner.VoteCount,
            SessionViews.ActionTextsOf(session, winner.ValueId)
        );
    }

    private static IReadOnlyList<RecordedValueView> PresentedValuesOf(
        Session session,
        GroupViews groupViews
    )
    {
        return SessionViews
            .Groups(session)
            .SelectMany(group => group.AssignedValues)
            .Select(valueId => new RecordedValueView(
                valueId.Value,
                groupViews.ValueViewOf(valueId).Text,
                SessionViews.ActionTextsOf(session, valueId)
            ))
            .ToList();
    }

    private static IReadOnlyList<RecordedRoundView> RoundsOf(Session session)
    {
        return session
            .Voting.ClosedRounds.Select(round => new RecordedRoundView(
                round.RoundNumber,
                round.Allotment,
                round
                    .EligibleValues.Select(valueId => new RecordedTallyView(
                        valueId.Value,
                        round.Tallies[valueId]
                    ))
                    .ToList()
            ))
            .ToList();
    }
}
