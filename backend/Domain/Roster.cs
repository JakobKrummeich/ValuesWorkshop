namespace ValuesWorkshop.Domain;

public sealed class Roster
{
    private readonly List<Participant> _participants = [];

    public IReadOnlyList<Participant> Participants => _participants;

    public bool Contains(ParticipantId participantId)
    {
        return Find(participantId) is not null;
    }

    public Participant? Find(ParticipantId participantId)
    {
        return _participants.SingleOrDefault(participant => participant.Id == participantId);
    }

    internal void Add(Participant participant)
    {
        _participants.Add(participant);
    }

    internal static Roster Restore(IEnumerable<Participant> participants)
    {
        var roster = new Roster();
        roster._participants.AddRange(participants);
        return roster;
    }
}
