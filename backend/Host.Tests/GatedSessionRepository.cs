using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Host.Tests;

internal sealed class GatedSessionRepository(
    ISessionRepository inner,
    SaveGate gate,
    CreateRace createRace
) : ISessionRepository
{
    public async Task CreateAsync(Session session)
    {
        if (createRace.ShouldARivalWinTheNextCreate())
        {
            await inner.CreateAsync(session);
        }

        await inner.CreateAsync(session);
    }

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
