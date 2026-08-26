namespace ValuesWorkshop.Domain;

public static class ValuePresentation
{
    public static void GoToNextValue(Session session)
    {
        RequireValuePresentationPhase(session);

        session.Presentation.GoToNextValue(session.Formation.Groups);
    }

    public static void CorrectActionWording(
        Session session,
        ActionId actionId,
        GroupActionText text
    )
    {
        RequireValuePresentationPhase(session);

        if (session.Presentation.PresentedValue is not { } presentedValue)
        {
            throw new InvariantViolationException(
                "Wording is corrected while a value is presented, not on a group intro."
            );
        }

        PresentingGroupOf(session).CorrectActionWording(actionId, presentedValue, text);
    }

    public static IReadOnlyList<GroupAction> PresentedActionsOf(Session session)
    {
        if (session.Presentation.PresentedValue is not { } presentedValue)
        {
            return [];
        }

        return PresentingGroupOf(session)
            .Actions.Where(action => action.ValueId == presentedValue)
            .ToList();
    }

    private static Group PresentingGroupOf(Session session)
    {
        return session.Formation.Groups.FirstOrDefault(group =>
                group.Name == session.Presentation.PresentingGroup
            )
            ?? throw new InvariantViolationException(
                "The presenting group is no longer part of the formation."
            );
    }

    private static void RequireValuePresentationPhase(Session session)
    {
        if (session.PhaseProgress.CurrentPhase != Phase.ValuePresentation)
        {
            throw new WrongPhaseException(
                "The presentation commands exist only during the value-presentation phase."
            );
        }
    }
}
