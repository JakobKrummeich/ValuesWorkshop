namespace ValuesWorkshop.Domain;

public sealed class PresentationOpening : IPhaseEntryAction
{
    public void ExecuteFor(Session session)
    {
        if (session.PhaseProgress.CurrentPhase != Phase.ValuePresentation)
        {
            return;
        }

        session.Presentation.Open(session.Formation.Groups);
    }
}
