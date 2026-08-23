namespace ValuesWorkshop.Domain;

public sealed record GroupFormationRequest(
    IReadOnlyList<ParticipantSelection> Participants,
    IReadOnlyList<ValueId> TopValues
)
{
    public static GroupFormationRequest For(Session session)
    {
        var participants = session
            .Roster.Participants.Select(participant => new ParticipantSelection(
                participant.Id,
                session.Selection.SelectedValuesOf(participant.Id)
            ))
            .ToList();

        return new GroupFormationRequest(participants, session.Selection.TopValues);
    }
}

public sealed record ParticipantSelection(
    ParticipantId ParticipantId,
    IReadOnlyList<ValueId> SelectedValues
);

public sealed record GroupFormationResult(IReadOnlyList<FormedGroup> Groups);

public sealed record FormedGroup(
    IReadOnlyList<ParticipantId> Members,
    IReadOnlyList<ValueId> AssignedValues
);
