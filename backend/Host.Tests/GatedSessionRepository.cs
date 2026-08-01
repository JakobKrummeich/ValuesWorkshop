using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Host.Tests;

internal sealed class GatedSessionRepository(ISessionRepository inner, SaveGate gate)
    : ISessionRepository
{
    public async Task SaveAsync(Session session, long expectedRevision)
    {
        await gate.PassAsync();

        await inner.SaveAsync(session, expectedRevision);
    }

    public Task<Session?> LoadAsync(SessionIdentity sessionIdentity)
    {
        return inner.LoadAsync(sessionIdentity);
    }

    public Task<IReadOnlyList<Session>> LoadAllAsync()
    {
        return inner.LoadAllAsync();
    }
}
