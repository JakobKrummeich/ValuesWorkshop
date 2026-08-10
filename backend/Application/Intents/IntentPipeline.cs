using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Application.Intents;

public sealed class IntentPipeline(SessionCommandHandler commandHandler)
{
    public async Task<IntentResult> ExecuteAsync(
        SessionIdentity sessionIdentity,
        Func<Session, bool> intent
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
        catch (WrongPhaseException exception)
        {
            return IntentResult.Rejected(IntentRejectionCode.WrongPhase, exception.Message);
        }
        catch (NotAuthorizedException exception)
        {
            return IntentResult.Rejected(IntentRejectionCode.NotAuthorized, exception.Message);
        }
        catch (InvariantViolationException exception)
        {
            return IntentResult.Rejected(IntentRejectionCode.InvariantViolated, exception.Message);
        }
        catch (MalformedPayloadException exception)
        {
            return IntentResult.Rejected(IntentRejectionCode.MalformedPayload, exception.Message);
        }
        catch (ConcurrencyConflictException exception)
        {
            return IntentResult.Rejected(
                IntentRejectionCode.ConcurrencyConflict,
                exception.Message
            );
        }

        return IntentResult.Accepted();
    }
}
