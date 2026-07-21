namespace ValuesWorkshop.Domain;

public sealed class Roster
{
    private readonly List<ParticipantId> _participants = [];

    public IReadOnlyList<ParticipantId> Participants => _participants;
}
