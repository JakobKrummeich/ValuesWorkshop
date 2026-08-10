using ValuesWorkshop.Application.Ports.Driven;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

internal static class SelectionViews
{
    internal static OwnSelectionView ForParticipant(
        Session session,
        ParticipantId caller,
        IValuesCatalog valuesCatalog
    )
    {
        return new OwnSelectionView(
            CatalogOf(valuesCatalog),
            OwnSelectedValueIds(session, caller),
            session.Selection.SubmittedBy.Contains(caller),
            SelectionTallies: null,
            TopValueIds: null
        );
    }

    internal static SelectionProgressView Progress(Session session, IValuesCatalog valuesCatalog)
    {
        return new SelectionProgressView(
            CatalogOf(valuesCatalog),
            session.Selection.SubmittedBy.Count,
            SelectionTallies: null,
            TopValueIds: null
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

    private static IReadOnlyList<WorkshopValueView> CatalogOf(IValuesCatalog valuesCatalog)
    {
        return valuesCatalog
            .Values.Select(value => new WorkshopValueView(
                value.ValueId,
                new LocalizedTextView(value.Text.German, value.Text.English)
            ))
            .ToList();
    }
}
