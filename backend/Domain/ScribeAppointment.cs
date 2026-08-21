namespace ValuesWorkshop.Domain;

public sealed class ScribeAppointment(IRandomness randomnessPort) : IPhaseEntryAction
{
    public void ExecuteFor(Session session)
    {
        if (session.PhaseProgress.CurrentPhase != Phase.GroupWork)
        {
            return;
        }

        foreach (var group in session.Formation.Groups)
        {
            group.AppointScribe(randomnessPort);
        }
    }
}
