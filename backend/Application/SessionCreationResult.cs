using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application;

public sealed record SessionCreationResult(
    bool IsAccepted,
    SessionIdentity? SessionIdentity,
    SessionCreationRejection? Rejection,
    string? Detail
)
{
    public static SessionCreationResult Accepted(SessionIdentity sessionIdentity)
    {
        return new SessionCreationResult(true, sessionIdentity, null, null);
    }

    public static SessionCreationResult PassphraseRejected()
    {
        return new SessionCreationResult(
            false,
            null,
            SessionCreationRejection.PassphraseRejected,
            null
        );
    }

    public static SessionCreationResult InvalidRequest(string detail)
    {
        return new SessionCreationResult(
            false,
            null,
            SessionCreationRejection.InvalidRequest,
            detail
        );
    }
}
