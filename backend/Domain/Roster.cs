namespace ValuesWorkshop.Domain;

public sealed class Roster
{
    private readonly List<ParticipantId> _participants = [];

    public IReadOnlyList<ParticipantId> Participants => _participants;

    public bool Contains(ParticipantId participantId)
    {
        return _participants.Contains(participantId);
    }

    internal void Add(ParticipantId participantId)
    {
        _participants.Add(participantId);
    }

    internal static Roster Restore(IEnumerable<ParticipantId> participants)
    {
        var roster = new Roster();
        roster._participants.AddRange(participants);
        return roster;
    }
}
