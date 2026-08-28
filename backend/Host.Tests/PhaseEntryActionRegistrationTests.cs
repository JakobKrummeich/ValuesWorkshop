using Microsoft.Extensions.DependencyInjection;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Host.Tests;

public sealed class PhaseEntryActionRegistrationTests : IClassFixture<WorkshopTestFactory>
{
    private readonly WorkshopTestFactory factory;

    public PhaseEntryActionRegistrationTests(WorkshopTestFactory factory)
    {
        this.factory = factory;
    }

    // WHY: an entry action reaches a session only through the
    // IEnumerable<IPhaseEntryAction> the composition root fills, and a forgotten
    // AddSingleton throws nothing — the phase just enters without its effect (no
    // scribes, no walk, no open voting round). Deleting the VotingOpening line in
    // Program.cs left all 779 backend tests green, so this test is what stands
    // between a missing registration and a dead phase in production.
    [Fact]
    public void Every_phase_entry_action_the_domain_defines_is_registered_in_the_host()
    {
        var definedActions = PhaseEntryActionsDefinedInTheDomain();
        var registeredActions = factory
            .Services.GetServices<IPhaseEntryAction>()
            .Select(action => action.GetType());

        definedActions.ShouldNotBeEmpty();
        registeredActions.ShouldBe(definedActions, ignoreOrder: true);
    }

    private static IReadOnlyList<Type> PhaseEntryActionsDefinedInTheDomain()
    {
        return
        [
            .. typeof(IPhaseEntryAction)
                .Assembly.GetExportedTypes()
                .Where(type =>
                    type is { IsInterface: false, IsAbstract: false }
                    && type.IsAssignableTo(typeof(IPhaseEntryAction))
                ),
        ];
    }
}
