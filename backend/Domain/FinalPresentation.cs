namespace ValuesWorkshop.Domain;

public static class FinalPresentation
{
    public static void RevealNextValue(Session session)
    {
        if (session.PhaseProgress.CurrentPhase != Phase.FinalPresentation)
        {
            throw new WrongPhaseException(
                "The reveal commands exist only during the final-presentation phase."
            );
        }

        session.Reveal.RevealNext(session.Voting.WinningValues.Count);
    }
}
