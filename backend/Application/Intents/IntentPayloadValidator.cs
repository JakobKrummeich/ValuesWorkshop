using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Intents;

internal static class IntentPayloadValidator
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

    internal static IReadOnlyList<SubmitGroupWorkAction> RequiredActions(
        IReadOnlyList<SubmitGroupWorkAction>? actions
    )
    {
        if (actions is null)
        {
            throw new MalformedPayloadException("A group-work value needs its actions.");
        }

        return actions;
    }

    internal static ActionId RequiredActionId(string? actionId)
    {
        return Guid.TryParse(actionId, out var value)
            ? new ActionId(value)
            : throw new MalformedPayloadException(
                "The action identifier is not a well-formed UUID."
            );
    }

    internal static IReadOnlyDictionary<ValueId, int> RequiredVotes(
        IReadOnlyList<SubmitFinalVote>? votes
    )
    {
        if (votes is null)
        {
            throw new MalformedPayloadException("A ballot needs its votes.");
        }

        var votesPerValue = new Dictionary<ValueId, int>();

        foreach (var vote in votes)
        {
            if (string.IsNullOrWhiteSpace(vote.ValueId))
            {
                throw new MalformedPayloadException("Every vote needs its value identifier.");
            }

            if (vote.VoteCount is not { } voteCount)
            {
                throw new MalformedPayloadException("Every vote needs its vote count.");
            }

            if (!votesPerValue.TryAdd(new ValueId(vote.ValueId), voteCount))
            {
                throw new MalformedPayloadException("A ballot lists each value at most once.");
            }
        }

        return votesPerValue;
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
