using ValuesWorkshop.Application.Ports.Driven;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

internal static class SelectionViews
{
    internal static OwnSelectionView ForParticipant(
        Session session,
        ParticipantId caller,
        IReadOnlyList<WorkshopValueView> catalogView
    )
    {
        return new OwnSelectionView(
            catalogView,
            OwnSelectedValueIds(session, caller),
            session.Selection.HasSubmitted(caller),
            SelectionTallies: null,
            TopValueIds: null
        );
    }

    internal static OwnSelectionView ForParticipantWithResults(
        Session session,
        ParticipantId caller,
        IReadOnlyList<WorkshopValueView> catalogView
    )
    {
        return new OwnSelectionView(
            catalogView,
            OwnSelectedValueIds(session, caller),
            session.Selection.HasSubmitted(caller),
            Tallies(session),
            TopValueIds(session, catalogView)
        );
    }

    internal static SelectionProgressView Progress(
        Session session,
        IReadOnlyList<WorkshopValueView> catalogView
    )
    {
        return new SelectionProgressView(
            catalogView,
            session.Selection.SubmittedCount,
            SelectionTallies: null,
            TopValueIds: null
        );
    }

    internal static SelectionProgressView ProgressWithResults(
        Session session,
        IReadOnlyList<WorkshopValueView> catalogView
    )
    {
        return new SelectionProgressView(
            catalogView,
            session.Selection.SubmittedCount,
            Tallies(session),
            TopValueIds(session, catalogView)
        );
    }

    private static IReadOnlyDictionary<string, int> Tallies(Session session)
    {
        return session.Selection.SelectionTallies.ToDictionary(
            tally => tally.Key.Value,
            tally => tally.Value
        );
    }

    private static IReadOnlyList<string> TopValueIds(
        Session session,
        IReadOnlyList<WorkshopValueView> catalogView
    )
    {
        var tallies = session.Selection.SelectionTallies;
        var catalogPositions = catalogView
            .Select((value, position) => (value.ValueId, position))
            .ToDictionary(entry => entry.ValueId, entry => entry.position);

        return SessionViews.ValueIdsOf(
            session
                .Selection.TopValues.OrderByDescending(valueId => tallies[valueId])
                .ThenBy(valueId => catalogPositions[valueId.Value])
        );
    }

    private static IReadOnlyList<string> OwnSelectedValueIds(Session session, ParticipantId caller)
    {
        return SessionViews.ValueIdsOf(
            session
                .Selection.SelectedValues.Where(selected => selected.ParticipantId == caller)
                .Select(selected => selected.ValueId)
        );
    }

    internal static IReadOnlyList<WorkshopValueView> CatalogOf(IValuesCatalog valuesCatalog)
    {
        return valuesCatalog
            .Values.Select(value => new WorkshopValueView(
                value.ValueId,
                new LocalizedTextView(value.Text.German, value.Text.English)
            ))
            .ToList();
    }
}
