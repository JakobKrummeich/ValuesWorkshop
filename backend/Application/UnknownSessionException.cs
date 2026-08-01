using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application;

public sealed class UnknownSessionException : Exception
{
    public UnknownSessionException(SessionIdentity sessionIdentity)
        : base($"No session exists with identity {sessionIdentity.Value}.") { }

    public UnknownSessionException()
        : base("No session exists with that identity.") { }

    public UnknownSessionException(string message)
        : base(message) { }

    public UnknownSessionException(string message, Exception innerException)
        : base(message, innerException) { }
}
