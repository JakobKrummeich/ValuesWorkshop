using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Intents;

public sealed class IntentPipeline(SessionCommandHandler commandHandler)
{
    public async Task<IntentResult> ExecuteAsync(
        SessionIdentity sessionIdentity,
        Action<Session> intent
    )
    {
        try
        {
            await commandHandler.HandleAsync(sessionIdentity, intent);
        }
        catch (UnknownSessionException exception)
        {
            return IntentResult.Rejected(IntentRejectionCode.UnknownSession, exception.Message);
        }
        catch (InvariantViolationException exception)
        {
            return IntentResult.Rejected(IntentRejectionCode.InvariantViolated, exception.Message);
        }

        return IntentResult.Accepted();
    }
}
