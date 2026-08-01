using System.Globalization;

namespace ValuesWorkshop.Domain.Ports;

public sealed class ConcurrencyConflictException : Exception
{
    public ConcurrencyConflictException(
        SessionIdentity sessionIdentity,
        long expectedRevision,
        long? storedRevision
    )
        : base(Describe(sessionIdentity, expectedRevision, storedRevision)) { }

    public ConcurrencyConflictException()
        : base("The session changed since it was loaded.") { }

    public ConcurrencyConflictException(string message)
        : base(message) { }

    public ConcurrencyConflictException(string message, Exception innerException)
        : base(message, innerException) { }

    private static string Describe(
        SessionIdentity sessionIdentity,
        long expectedRevision,
        long? storedRevision
    )
    {
        var stored = storedRevision?.ToString(CultureInfo.InvariantCulture) ?? "none";

        return string.Create(
            CultureInfo.InvariantCulture,
            $"Session {sessionIdentity.Value} expected revision {expectedRevision} but the stored revision was {stored}."
        );
    }
}
