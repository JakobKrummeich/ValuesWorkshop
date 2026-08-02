using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Intents;

public sealed class FacilitatorIntentHandler(IntentPipeline pipeline, PhaseExitGuards exitGuards)
{
    public Task<IntentResult> HandleAsync(AdvancePhaseCommand command)
    {
        return pipeline.ExecuteAsync(
            command.SessionIdentity,
            session =>
            {
                session.AdvancePhase(command.Actor, exitGuards);
                return true;
            }
        );
    }
}
