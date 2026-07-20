namespace ValuesWorkshop.Domain;

/// <summary>Membership: participants + facilitator, reconnect/resume. Enforces I4.</summary>
public sealed class Roster
{
    private readonly List<ParticipantId> _participants = [];

    public IReadOnlyList<ParticipantId> Participants => _participants;
}
