using ValuesWorkshop.Host.Auth;

namespace ValuesWorkshop.Host.Tests;

public class FacilitatorPassphraseTests
{
    [Fact]
    public void The_configured_secret_matches_itself()
    {
        var passphrase = new FacilitatorPassphrase("a-configured-secret");

        passphrase.Matches("a-configured-secret").ShouldBeTrue();
    }

    [Fact]
    public void A_different_candidate_of_the_same_length_does_not_match()
    {
        var passphrase = new FacilitatorPassphrase("a-configured-secret");

        passphrase.Matches("a-configured-secrat").ShouldBeFalse();
    }

    [Fact]
    public void A_candidate_of_a_different_length_does_not_match()
    {
        var passphrase = new FacilitatorPassphrase("a-configured-secret");

        passphrase.Matches("a-configured-secret-with-more").ShouldBeFalse();
    }

    [Fact]
    public void An_empty_candidate_does_not_match()
    {
        var passphrase = new FacilitatorPassphrase("a-configured-secret");

        passphrase.Matches(string.Empty).ShouldBeFalse();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void A_blank_configured_secret_is_refused(string configured)
    {
        Action construction = () => _ = new FacilitatorPassphrase(configured);

        construction
            .ShouldThrow<InvalidOperationException>()
            .Message.ShouldContain("FACILITATOR_PASSPHRASE");
    }

    [Fact]
    public void A_missing_configured_secret_is_refused()
    {
        Action construction = () => _ = new FacilitatorPassphrase(null);

        construction.ShouldThrow<InvalidOperationException>();
    }
}
