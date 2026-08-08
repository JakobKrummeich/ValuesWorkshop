using System.Security.Claims;
using ValuesWorkshop.Adapters.Web;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Tests;

public class CallerDisplayNameTests
{
    private static readonly ParticipantId Anna = new(
        Guid.Parse("abcdef12-0000-4000-8000-000000000009")
    );

    [Fact]
    public void The_name_claim_becomes_the_display_name()
    {
        NameOf(new Claim("name", "Anna Schmidt")).Value.ShouldBe("Anna Schmidt");
    }

    [Fact]
    public void A_provider_that_only_sends_the_standard_name_claim_is_understood()
    {
        NameOf(new Claim(ClaimTypes.Name, "Anna Schmidt")).Value.ShouldBe("Anna Schmidt");
    }

    [Fact]
    public void The_name_claim_wins_over_the_standard_name_claim()
    {
        NameOf(new Claim("name", "Anna Schmidt"), new Claim(ClaimTypes.Name, "anna@example.com"))
            .Value.ShouldBe("Anna Schmidt");
    }

    [Fact]
    public void A_connection_without_a_name_claim_falls_back_to_the_label_of_its_id()
    {
        NameOf().Value.ShouldBe("#abcdef");
    }

    [Fact]
    public void A_blank_name_claim_falls_back_to_the_label_of_its_id()
    {
        NameOf(new Claim("name", "   ")).Value.ShouldBe("#abcdef");
    }

    private static ParticipantName NameOf(params Claim[] claims)
    {
        var context = new FakeHubCallerContext(sessionIdentityQuery: null, subject: "anna", claims);

        return CallerDisplayName.Of(context, Anna);
    }
}
