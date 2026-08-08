namespace ValuesWorkshop.Domain.Tests;

public class ParticipantNameTests
{
    private static readonly ParticipantId Anna = new(
        Guid.Parse("a1b2c3d4-0000-4000-8000-000000000001")
    );
    private static readonly ParticipantId Ben = new(
        Guid.Parse("f9e8d7c6-0000-4000-8000-000000000002")
    );

    [Fact]
    public void A_name_keeps_what_the_claim_says()
    {
        ParticipantName.Of("Anna Schmidt", Anna).Value.ShouldBe("Anna Schmidt");
    }

    [Fact]
    public void Surrounding_whitespace_is_trimmed_away()
    {
        ParticipantName.Of("  Anna Schmidt \t\n", Anna).Value.ShouldBe("Anna Schmidt");
    }

    [Fact]
    public void A_name_longer_than_eighty_characters_is_truncated()
    {
        var name = ParticipantName.Of(new string('a', 200), Anna);

        name.Value.Length.ShouldBe(80);
        name.Value.ShouldBe(new string('a', 80));
    }

    [Fact]
    public void A_name_of_exactly_eighty_characters_survives_whole()
    {
        ParticipantName.Of(new string('a', 80), Anna).Value.ShouldBe(new string('a', 80));
    }

    [Fact]
    public void Truncation_never_splits_a_character_made_of_several_code_units()
    {
        var name = ParticipantName.Of(string.Concat(Enumerable.Repeat("\U0001F600", 200)), Anna);

        name.Value.ShouldBe(string.Concat(Enumerable.Repeat("\U0001F600", 80)));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void A_missing_name_falls_back_to_a_label_built_from_the_participant_id(
        string? candidate
    )
    {
        ParticipantName.Of(candidate, Anna).Value.ShouldBe("#a1b2c3");
    }

    [Fact]
    public void The_fallback_label_tells_two_participants_apart()
    {
        ParticipantName.Of(null, Anna).ShouldNotBe(ParticipantName.Of(null, Ben));
        ParticipantName.Of(null, Ben).Value.ShouldBe("#f9e8d7");
    }

    [Fact]
    public void Two_names_with_the_same_text_are_the_same_value()
    {
        ParticipantName.Of("Anna", Anna).ShouldBe(ParticipantName.Of(" Anna ", Ben));
    }
}
