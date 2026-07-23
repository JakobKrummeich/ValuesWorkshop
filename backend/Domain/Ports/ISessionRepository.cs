namespace ValuesWorkshop.Domain.Ports;

public interface ISessionRepository
{
    Task SaveAsync(SessionIdentity sessionIdentity, Session session);
    Task<Session?> LoadAsync(SessionIdentity sessionIdentity);
    Task<IReadOnlyList<(SessionIdentity Identity, Session Session)>> LoadAllAsync();
}
