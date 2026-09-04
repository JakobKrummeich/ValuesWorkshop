using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using ValuesWorkshop.Adapters.Web;

namespace ValuesWorkshop.Host.Tests;

// WHY: the two background loops read their cadence from one hand-written line each in
// Program.cs, and nothing else in the tree sets these keys — no compose file, no test.
// A mistyped key or a copied-over default therefore fails silently: the deployment's
// tuning is ignored, the loop keeps running on the fallback, and every gate stays green.
// These tests pin the key string and the default documented in README.md
// ("Backend configuration"), so that mistake fails here. Sibling:
// DeployedFormationWindowTests does the same for GROUP_FORMATION_WINDOW_MS.
public sealed class DeployedLoopIntervalsTests : IClassFixture<WorkshopTestFactory>
{
    private readonly WorkshopTestFactory factory;

    public DeployedLoopIntervalsTests(WorkshopTestFactory factory)
    {
        this.factory = factory;
    }

    [Fact]
    public void A_backend_that_is_told_nothing_resends_the_state_twice_a_second()
    {
        using var backend = BackendToldNothing();

        backend
            .Services.GetRequiredService<StateResendInterval>()
            .Value.ShouldBe(TimeSpan.FromMilliseconds(500));
    }

    [Fact]
    public void A_backend_told_how_often_to_resend_the_state_resends_it_that_often()
    {
        using var backend = BackendTold("STATE_RESEND_INTERVAL_MS", milliseconds: 1500);

        backend
            .Services.GetRequiredService<StateResendInterval>()
            .Value.ShouldBe(TimeSpan.FromMilliseconds(1500));
    }

    [Fact]
    public void A_backend_that_is_told_nothing_ticks_group_formation_every_fifty_milliseconds()
    {
        using var backend = BackendToldNothing();

        backend
            .Services.GetRequiredService<GroupFormationTickInterval>()
            .Value.ShouldBe(TimeSpan.FromMilliseconds(50));
    }

    [Fact]
    public void A_backend_told_how_often_to_tick_group_formation_ticks_it_that_often()
    {
        using var backend = BackendTold("GROUP_FORMATION_TICK_INTERVAL_MS", milliseconds: 120);

        backend
            .Services.GetRequiredService<GroupFormationTickInterval>()
            .Value.ShouldBe(TimeSpan.FromMilliseconds(120));
    }

    [Fact]
    public void A_backend_that_is_told_nothing_looks_for_forming_sessions_four_times_a_second()
    {
        using var backend = BackendToldNothing();

        backend
            .Services.GetRequiredService<GroupFormationDiscoveryInterval>()
            .Value.ShouldBe(TimeSpan.FromMilliseconds(250));
    }

    [Fact]
    public void A_backend_told_how_often_to_look_for_forming_sessions_looks_that_often()
    {
        using var backend = BackendTold("GROUP_FORMATION_DISCOVERY_INTERVAL_MS", milliseconds: 800);

        backend
            .Services.GetRequiredService<GroupFormationDiscoveryInterval>()
            .Value.ShouldBe(TimeSpan.FromMilliseconds(800));
    }

    private WebApplicationFactory<AssemblyMarker> BackendToldNothing()
    {
        return factory.WithWebHostBuilder(_ => { });
    }

    private WebApplicationFactory<AssemblyMarker> BackendTold(string key, int milliseconds)
    {
        return factory.WithWebHostBuilder(builder =>
            builder.UseSetting(key, milliseconds.ToString())
        );
    }
}
