namespace ValuesWorkshop.Domain;

public sealed class SelectionRound
{
    public const int ValuesPerSelection = 10;

    private const int TopValueTargetCount = 10;

    private readonly List<SelectedValue> selectedValues = [];
    private readonly List<ValueId> topValues = [];

    public IReadOnlyList<SelectedValue> SelectedValues => selectedValues;
    public IReadOnlyList<ValueId> TopValues => topValues;

    public IReadOnlyList<ParticipantId> SubmittedBy =>
        selectedValues.Select(selected => selected.ParticipantId).Distinct().ToList();

    public int SubmittedCount =>
        selectedValues.Select(selected => selected.ParticipantId).Distinct().Count();

    public IReadOnlyList<ValueId> SelectedValuesOf(ParticipantId participantId) =>
        selectedValues
            .Where(selected => selected.ParticipantId == participantId)
            .Select(selected => selected.ValueId)
            .ToList();

    public bool HasSubmitted(ParticipantId participantId) =>
        selectedValues.Any(selected => selected.ParticipantId == participantId);

    public IReadOnlyDictionary<ValueId, int> SelectionTallies =>
        selectedValues
            .GroupBy(selected => selected.ValueId)
            .ToDictionary(group => group.Key, group => group.Count());

    internal void Submit(
        ParticipantId participantId,
        IReadOnlyList<ValueId> valueIds,
        IReadOnlySet<ValueId> validValueIds
    )
    {
        if (
            valueIds.Distinct().Count() != ValuesPerSelection
            || valueIds.Count != ValuesPerSelection
        )
        {
            throw new MalformedPayloadException(
                $"A value selection must contain exactly {ValuesPerSelection} distinct value ids."
            );
        }

        foreach (var valueId in valueIds)
        {
            if (!validValueIds.Contains(valueId))
            {
                throw new MalformedPayloadException(
                    $"The value selection contains an unknown value id '{valueId.Value}'."
                );
            }
        }

        if (selectedValues.Any(selected => selected.ParticipantId == participantId))
        {
            throw new InvariantViolationException(
                "Each participant submits a value selection exactly once."
            );
        }

        selectedValues.AddRange(
            valueIds.Select(valueId => new SelectedValue(participantId, valueId))
        );
    }

    internal void DetermineTopValues()
    {
        if (topValues.Count > 0 || selectedValues.Count == 0)
        {
            return;
        }

        var cutoffCount = SelectionTallies
            .Values.OrderByDescending(count => count)
            .Take(TopValueTargetCount)
            .Last();

        topValues.AddRange(
            SelectionTallies.Where(tally => tally.Value >= cutoffCount).Select(tally => tally.Key)
        );
    }

    internal static SelectionRound Restore(
        IEnumerable<SelectedValue> selectedValues,
        IEnumerable<ValueId> topValues
    )
    {
        var round = new SelectionRound();
        round.selectedValues.AddRange(selectedValues);
        round.topValues.AddRange(topValues);

        return round;
    }
}
