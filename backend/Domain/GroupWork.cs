namespace ValuesWorkshop.Domain;

public static class GroupWork
{
    public static void AddAction(
        Session session,
        ParticipantId caller,
        ActionId actionId,
        ValueId valueId
    )
    {
        WorkingGroupOf(session, caller).AddAction(caller, actionId, valueId);
    }

    public static void EditAction(
        Session session,
        ParticipantId caller,
        ActionId actionId,
        GroupActionText text
    )
    {
        WorkingGroupOf(session, caller).EditAction(caller, actionId, text);
    }

    public static void RemoveAction(Session session, ParticipantId caller, ActionId actionId)
    {
        WorkingGroupOf(session, caller).RemoveAction(caller, actionId);
    }

    public static void Submit(Session session, ParticipantId caller)
    {
        WorkingGroupOf(session, caller).Submit(caller);
    }

    public static void Reopen(Session session, ParticipantId caller)
    {
        WorkingGroupOf(session, caller).Reopen(caller);
    }

    public static void ReassignScribe(Session session, ParticipantId newScribe)
    {
        if (!session.Roster.Contains(newScribe))
        {
            throw new UnknownParticipantException(
                "The scribe role can only be handed to a participant on the roster."
            );
        }

        if (session.PhaseProgress.CurrentPhase != Phase.GroupWork)
        {
            throw new WrongPhaseException(
                "The scribe role is reassigned during the group-work phase only."
            );
        }

        var group =
            GroupContaining(session, newScribe)
            ?? throw new InvariantViolationException(
                "The scribe role can only be handed to a participant placed in a group."
            );

        group.ReassignScribe(newScribe);
    }

    private static Group WorkingGroupOf(Session session, ParticipantId caller)
    {
        if (!session.Roster.Contains(caller))
        {
            throw new NotAuthorizedException(
                "Only a joined participant may work on a group result."
            );
        }

        if (session.PhaseProgress.CurrentPhase != Phase.GroupWork)
        {
            throw new WrongPhaseException(
                "The group-work commands exist only during the group-work phase."
            );
        }

        return GroupContaining(session, caller)
            ?? throw new NotAuthorizedException(
                "Only a participant placed in a group may work on its result."
            );
    }

    private static Group? GroupContaining(Session session, ParticipantId participantId)
    {
        return session.Formation.Groups.FirstOrDefault(group =>
            group.Members.Contains(participantId)
        );
    }
}
