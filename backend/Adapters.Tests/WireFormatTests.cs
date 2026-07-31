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
    public void A_state_carries_the_blocks_of_its_own_phase_and_nothing_else()
    {
        var session = new Session(new SessionIdentity(Guid.NewGuid()));

        var json = SerializeStateMessage(FacilitatorWorkshopStateMapper.Map(session, 0));

        using var document = JsonDocument.Parse(json);
        var state = document.RootElement.GetProperty("arguments")[0];
        state
            .EnumerateObject()
            .Select(property => property.Name)
            .ShouldBe(["phase", "revision", "roster"], ignoreOrder: true);
    }

    [Theory]
    [MemberData(nameof(EveryPhase))]
    public void Every_role_state_travels_with_its_phase_as_the_discriminator(Phase phase)
    {
        var session = SessionInPhase(phase);
        var caller = new ParticipantId(Guid.NewGuid());

        DiscriminatorOf(FacilitatorWorkshopStateMapper.Map(session, 1)).ShouldBe((int)phase);
        DiscriminatorOf(ParticipantWorkshopStateMapper.MapFor(session, caller, 1))
            .ShouldBe((int)phase);
        DiscriminatorOf(PresenterWorkshopStateMapper.Map(session, 1)).ShouldBe((int)phase);
    }

    public static TheoryData<Phase> EveryPhase()
    {
        return [.. Enum.GetValues<Phase>()];
    }

    private static Session SessionInPhase(Phase phase)
    {
        var session = new Session(new SessionIdentity(Guid.NewGuid()));

        while (session.PhaseProgress.CurrentPhase != phase)
        {
            session.AdvancePhase();
        }

        return session;
    }

    private static int DiscriminatorOf(object state)
    {
        using var document = JsonDocument.Parse(SerializeStateMessage(state));

        return document.RootElement.GetProperty("arguments")[0].GetProperty("phase").GetInt32();
    }

    private static string SerializeStateMessage(object state)
    {
        var protocol = new JsonHubProtocol(Options.Create(new JsonHubProtocolOptions()));

        var message = new InvocationMessage("ReceiveWorkshopState", [state]);
        var bytes = protocol.GetMessageBytes(message);

        return Encoding.UTF8.GetString(bytes.ToArray()).TrimEnd('\u001e');
    }
}
