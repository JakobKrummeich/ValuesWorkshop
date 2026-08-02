using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application;

public abstract record SessionCreationResult
{
    private protected SessionCreationResult() { }

    public sealed record Accepted(SessionIdentity SessionIdentity) : SessionCreationResult;

    public sealed record PassphraseRejected : SessionCreationResult;

    public sealed record InvalidRequest : SessionCreationResult;

    public sealed record CreationUnavailable : SessionCreationResult;
}
