namespace ValuesWorkshop.Domain;

public sealed class Roster
{
    private readonly List<ParticipantId> _participants = [];

    public IReadOnlyList<ParticipantId> Participants => _participants;

    internal static Roster Restore(IEnumerable<ParticipantId> participants)
    {
        var roster = new Roster();
        roster._participants.AddRange(participants);
        return roster;
    }
}
