namespace ValuesWorkshop.Domain;

public sealed class SelectionRound
{
    public const int ValuesPerSelection = 10;

    private readonly List<SelectedValue> selectedValues = [];
    private readonly List<ValueId> topValues = [];

    public IReadOnlyList<SelectedValue> SelectedValues => selectedValues;
    public IReadOnlyList<ValueId> TopValues => topValues;

    public IReadOnlyList<ParticipantId> SubmittedBy =>
        selectedValues.Select(selected => selected.ParticipantId).Distinct().ToList();

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
