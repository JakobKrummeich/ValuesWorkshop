using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ValuesWorkshop.Host.Tests;

public sealed class WireProtocolOptionsTests : IClassFixture<WorkshopTestFactory>
{
    private readonly WorkshopTestFactory factory;

    public WireProtocolOptionsTests(WorkshopTestFactory factory)
    {
        this.factory = factory;
    }

    // WHY: the contract/ corpus is produced against a default JsonHubProtocol
    // (backend/Adapters.Tests/WireContract.cs), because that is what the host
    // registers today. Customising the payload serializer here — a naming policy,
    // a string enum converter — would leave every one of those gates passing while
    // describing a wire format the host no longer speaks.
    [Fact]
    public void The_host_pushes_state_with_the_serializer_the_contract_corpus_records()
    {
        var options = factory
            .Services.GetRequiredService<IOptions<JsonHubProtocolOptions>>()
            .Value.PayloadSerializerOptions;
        var registered = new JsonHubProtocolOptions().PayloadSerializerOptions;

        options.PropertyNamingPolicy.ShouldBe(registered.PropertyNamingPolicy);
        options.DictionaryKeyPolicy.ShouldBe(registered.DictionaryKeyPolicy);
        options.DefaultIgnoreCondition.ShouldBe(registered.DefaultIgnoreCondition);
        options.NumberHandling.ShouldBe(registered.NumberHandling);
        options
            .Converters.Select(converter => converter.GetType())
            .ShouldBe(registered.Converters.Select(converter => converter.GetType()));
        JsonSerializer
            .Serialize(TestPhase.Second, options)
            .ShouldBe(JsonSerializer.Serialize(TestPhase.Second, registered));
    }

    private enum TestPhase
    {
        First = 1,
        Second = 2,
    }
}
