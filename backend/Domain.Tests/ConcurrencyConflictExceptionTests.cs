using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Domain.Tests;

public class ConcurrencyConflictExceptionTests
{
    [Fact]
    public void Message_names_the_session_and_both_revisions()
    {
        var sessionIdentity = new SessionIdentity(Guid.NewGuid());

        var exception = new ConcurrencyConflictException(sessionIdentity, 4, 7);

        exception.Message.ShouldContain(sessionIdentity.Value.ToString());
        exception.Message.ShouldContain("4");
        exception.Message.ShouldContain("7");
    }

    [Fact]
    public void Message_reports_a_missing_row_as_no_stored_revision()
    {
        var sessionIdentity = new SessionIdentity(Guid.NewGuid());

        var exception = new ConcurrencyConflictException(sessionIdentity, 3, storedRevision: null);

        exception.Message.ShouldContain(sessionIdentity.Value.ToString());
        exception.Message.ShouldContain("none");
    }
}
