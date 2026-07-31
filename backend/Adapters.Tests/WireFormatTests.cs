using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Protocol;
using Microsoft.Extensions.Options;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Tests;

public class WireFormatTests
{
    [Fact]
    public void Workshop_state_travels_as_camel_case_json_with_numeric_enums()
    {
        var session = new Session(new SessionIdentity(Guid.NewGuid()));
        session.AdvancePhase();
        session.BumpRevision();

        var json = SerializeStateMessage(FacilitatorWorkshopStateMapper.Map(session, 1));

        using var document = JsonDocument.Parse(json);
        var state = document.RootElement.GetProperty("arguments")[0];
        state.GetProperty("revision").GetInt64().ShouldBe(1);
        state.GetProperty("phase").GetInt32().ShouldBe((int)Phase.Quiz);
        state.GetProperty("roster").GetProperty("participantCount").GetInt32().ShouldBe(0);
    }

    [Fact]
    public void A_block_that_is_not_relevant_yet_travels_as_null()
    {
        var session = new Session(new SessionIdentity(Guid.NewGuid()));

        var json = SerializeStateMessage(FacilitatorWorkshopStateMapper.Map(session, 0));

        using var document = JsonDocument.Parse(json);
        var state = document.RootElement.GetProperty("arguments")[0];
        state.GetProperty("quiz").ValueKind.ShouldBe(JsonValueKind.Null);
    }

    private static string SerializeStateMessage(object state)
    {
        var protocol = new JsonHubProtocol(Options.Create(new JsonHubProtocolOptions()));

        var message = new InvocationMessage("ReceiveWorkshopState", [state]);
        var bytes = protocol.GetMessageBytes(message);

        return Encoding.UTF8.GetString(bytes.ToArray()).TrimEnd('\u001e');
    }
}
