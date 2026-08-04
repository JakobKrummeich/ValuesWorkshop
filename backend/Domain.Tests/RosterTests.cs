namespace ValuesWorkshop.Domain.Tests;

public class RosterTests
{
    private static readonly ParticipantId AnnaId = new(
        Guid.Parse("00000000-0000-0000-0000-0000000000a1")
    );
    private static readonly ParticipantId BenId = new(
        Guid.Parse("00000000-0000-0000-0000-0000000000b2")
    );

    [Fact]
    public void New_roster_has_no_participants()
    {
        new Roster().Participants.ShouldBeEmpty();
    }

    [Fact]
    public void A_restored_roster_carries_every_participant_with_its_name()
    {
        var roster = Roster.Restore([TestParticipants.Named(AnnaId, "Anna")]);

        roster.Participants.ShouldBe([TestParticipants.Named(AnnaId, "Anna")]);
        roster.Contains(AnnaId).ShouldBeTrue();
    }

    [Fact]
    public void A_participant_who_never_joined_is_absent()
    {
        var roster = Roster.Restore([TestParticipants.Named(AnnaId, "Anna")]);

        roster.Contains(BenId).ShouldBeFalse();
        roster.Find(BenId).ShouldBeNull();
    }

    [Fact]
    public void A_participant_is_found_by_id()
    {
        var roster = Roster.Restore([
            TestParticipants.Named(AnnaId, "Anna"),
            TestParticipants.Named(BenId, "Ben"),
        ]);

        roster.Find(BenId).ShouldBe(TestParticipants.Named(BenId, "Ben"));
    }
}
