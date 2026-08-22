using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Intents;

internal static class IntentPayload
{
    internal static ValueId RequiredValueId(string? valueId)
    {
        if (string.IsNullOrWhiteSpace(valueId))
        {
            throw new MalformedPayloadException("An action needs a value identifier.");
        }

        return new ValueId(valueId);
    }

    internal static IReadOnlyList<ValueId> RequiredValueIds(IReadOnlyList<string>? valueIds)
    {
        if (valueIds is null)
        {
            throw new MalformedPayloadException("A selection needs its value identifiers.");
        }

        return valueIds.Select(valueId => new ValueId(valueId)).ToList();
    }

    internal static ActionId RequiredActionId(string? actionId)
    {
        return Guid.TryParse(actionId, out var value)
            ? new ActionId(value)
            : throw new MalformedPayloadException(
                "The action identifier is not a well-formed UUID."
            );
    }

    internal static ParticipantId RequiredParticipantId(string? participantId)
    {
        return Guid.TryParse(participantId, out var value)
            ? new ParticipantId(value)
            : throw new MalformedPayloadException(
                "The participant identifier is not a well-formed UUID."
            );
    }
}
