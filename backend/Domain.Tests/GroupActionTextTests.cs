namespace ValuesWorkshop.Domain.Tests;

public class GroupActionTextTests
{
    [Fact]
    public void A_text_keeps_what_the_scribe_wrote()
    {
        GroupActionText
            .Of("Talk openly about mistakes")
            .Value.ShouldBe("Talk openly about mistakes");
    }

    [Fact]
    public void Surrounding_whitespace_is_trimmed_away()
    {
        GroupActionText.Of("  Talk openly \t\n").Value.ShouldBe("Talk openly");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void A_blank_text_produces_an_empty_value(string? candidate)
    {
        GroupActionText.Of(candidate).Value.ShouldBe("");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void A_blank_text_is_recognized_as_empty(string? candidate)
    {
        GroupActionText.Of(candidate).IsEmpty.ShouldBeTrue();
    }

    [Fact]
    public void A_non_blank_text_is_not_empty()
    {
        GroupActionText.Of("Talk openly").IsEmpty.ShouldBeFalse();
    }

    [Fact]
    public void A_text_longer_than_two_hundred_text_elements_is_truncated()
    {
        GroupActionText.Of(new string('a', 500)).Value.ShouldBe(new string('a', 200));
    }

    [Fact]
    public void A_text_of_exactly_two_hundred_text_elements_survives_whole()
    {
        GroupActionText.Of(new string('a', 200)).Value.ShouldBe(new string('a', 200));
    }

    [Fact]
    public void Truncation_never_splits_a_character_made_of_several_code_units()
    {
        var text = GroupActionText.Of(string.Concat(Enumerable.Repeat("\U0001F600", 300)));

        text.Value.ShouldBe(string.Concat(Enumerable.Repeat("\U0001F600", 200)));
    }

    [Fact]
    public void Two_texts_with_the_same_words_are_the_same_value()
    {
        GroupActionText.Of("Listen first").ShouldBe(GroupActionText.Of(" Listen first "));
    }
}
