using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Application.Intents;

public sealed class IntentPipeline(SessionCommandHandler commandHandler)
{
    private static readonly IReadOnlyDictionary<
        Type,
        IntentRejectionCode
    > rejectionCodeOfExceptionType = new Dictionary<Type, IntentRejectionCode>
    {
        [typeof(UnknownSessionException)] = IntentRejectionCode.UnknownSession,
        [typeof(WrongPhaseException)] = IntentRejectionCode.WrongPhase,
        [typeof(NotAuthorizedException)] = IntentRejectionCode.NotAuthorized,
        [typeof(UnknownParticipantException)] = IntentRejectionCode.UnknownParticipant,
        [typeof(InvariantViolationException)] = IntentRejectionCode.InvariantViolated,
        [typeof(MalformedPayloadException)] = IntentRejectionCode.MalformedPayload,
        [typeof(ConcurrencyConflictException)] = IntentRejectionCode.ConcurrencyConflict,
    };

    public async Task<IntentResult> ExecuteAsync(
        SessionIdentity sessionIdentity,
        Func<Session, bool> intent
    )
    {
        try
        {
            await commandHandler.HandleAsync(sessionIdentity, intent);
        }
        catch (Exception exception)
            when (rejectionCodeOfExceptionType.TryGetValue(exception.GetType(), out var code))
        {
            return IntentResult.Rejected(code, exception.Message);
        }

        return IntentResult.Accepted();
    }
}
