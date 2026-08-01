using ValuesWorkshop.Adapters.Web;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Tests;

public class SessionConnectionRegistryTests
{
    private static readonly SessionIdentity SessionOne = new(
        Guid.Parse("00000000-0000-0000-0000-00000000f00d")
    );

    private static readonly SessionIdentity SessionTwo = new(
        Guid.Parse("00000000-0000-0000-0000-00000000beef")
    );

    private readonly SessionConnectionRegistry registry = new();

    [Fact]
    public void A_session_is_listed_once_no_matter_how_many_clients_it_has()
    {
        registry.Add(SessionOne, "connection-1");
        registry.Add(SessionOne, "connection-2");
        registry.Add(SessionTwo, "connection-3");

        registry.ConnectedSessions().ShouldBe([SessionOne, SessionTwo], ignoreOrder: true);
    }

    [Fact]
    public void A_session_stays_listed_while_one_client_remains()
    {
        registry.Add(SessionOne, "connection-1");
        registry.Add(SessionOne, "connection-2");

        registry.Remove("connection-1");

        registry.ConnectedSessions().ShouldBe([SessionOne]);
    }

    [Fact]
    public void A_session_disappears_when_its_last_client_leaves()
    {
        registry.Add(SessionOne, "connection-1");

        registry.Remove("connection-1");

        registry.ConnectedSessions().ShouldBeEmpty();
    }

    [Fact]
    public void Removing_an_unknown_connection_changes_nothing()
    {
        registry.Add(SessionOne, "connection-1");

        registry.Remove("connection-unknown");

        registry.ConnectedSessions().ShouldBe([SessionOne]);
    }
}
