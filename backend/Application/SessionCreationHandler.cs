using ValuesWorkshop.Application.Ports.Driven;
using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Application;

public sealed class SessionCreationHandler(
    ISessionRepository repository,
    IFacilitatorPassphrase passphrase
)
{
    public async Task<SessionCreationResult> CreateAsync(
        FacilitatorSubject facilitator,
        SessionName name,
        string candidatePassphrase
    )
    {
        if (!passphrase.Matches(candidatePassphrase))
        {
            return SessionCreationResult.PassphraseRejected();
        }

        Session session;

        try
        {
            session = Session.Open(new SessionIdentity(Guid.NewGuid()), facilitator, name);
        }
        catch (InvariantViolationException exception)
        {
            return SessionCreationResult.InvalidRequest(exception.Message);
        }

        await repository.CreateAsync(session);

        return SessionCreationResult.Accepted(session.Identity);
    }
}
