using ValuesWorkshop.Application;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Tests;

public class WireFormatTests
{
    private static readonly TestQuizCatalog Catalog = new(5);
    private static readonly TestValuesCatalog ValuesCatalog = new(50);
    private static readonly TestAnimalsCatalog AnimalsCatalog = new(8);
    private static readonly FacilitatorWorkshopStateMapper FacilitatorStateMapper = new(
        Catalog,
        ValuesCatalog,
        AnimalsCatalog,
        new TestFormationProgress(0)
    );
    private static readonly ParticipantWorkshopStateMapper ParticipantStateMapper = new(
        Catalog,
        ValuesCatalog,
        AnimalsCatalog,
        new TestFormationProgress(0)
    );
    private static readonly PresenterWorkshopStateMapper PresenterStateMapper = new(
        Catalog,
        ValuesCatalog,
        AnimalsCatalog,
        new TestFormationProgress(0)
    );

    [Fact]
    public void Workshop_state_travels_as_camel_case_json_with_numeric_enums()
    {
        var session = TestSessions.Open(new SessionIdentity(Guid.NewGuid()));
        session.AdvancePhase();
        session.BumpRevision();

        var state = WireContract.WireFormOf(FacilitatorStateMapper.Map(session, 1));

        state.GetProperty("revision").GetInt64().ShouldBe(1);
        state.GetProperty("phase").GetInt32().ShouldBe((int)Phase.Quiz);
        state.GetProperty("roster").GetProperty("participantCount").GetInt32().ShouldBe(0);
        state.GetProperty("enabledIntents")[0].GetString().ShouldBe("RevealAnswer");
    }

    [Fact]
    public void A_state_carries_the_blocks_of_its_own_phase_and_nothing_else()
    {
        var session = TestSessions.Open(new SessionIdentity(Guid.NewGuid()));

        var state = WireContract.WireFormOf(FacilitatorStateMapper.Map(session, 0));

        state
            .EnumerateObject()
            .Select(property => property.Name)
            .ShouldBe(["phase", "revision", "roster", "enabledIntents"], ignoreOrder: true);
    }

    [Theory]
    [MemberData(nameof(EveryPhase))]
    public void Every_role_state_travels_with_its_phase_as_the_discriminator(Phase phase)
    {
        var session = SessionInPhase(phase);
        var caller = new ParticipantId(Guid.NewGuid());

        DiscriminatorOf(FacilitatorStateMapper.Map(session, 1)).ShouldBe((int)phase);
        DiscriminatorOf(ParticipantStateMapper.MapFor(session, caller, 1)).ShouldBe((int)phase);
        DiscriminatorOf(PresenterStateMapper.Map(session, 1)).ShouldBe((int)phase);
    }

    public static TheoryData<Phase> EveryPhase()
    {
        return [.. Enum.GetValues<Phase>()];
    }

    private static Session SessionInPhase(Phase phase)
    {
        return TestSessions.InPhase(new SessionIdentity(Guid.NewGuid()), phase);
    }

    private static int DiscriminatorOf(object state)
    {
        return WireContract.WireFormOf(state).GetProperty("phase").GetInt32();
    }
}
