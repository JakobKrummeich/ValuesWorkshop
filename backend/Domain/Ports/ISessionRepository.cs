namespace ValuesWorkshop.Domain.Ports;

public interface ISessionRepository
{
    Task SaveAsync(string sessionIdentity, Session session);
    Task<Session?> LoadAsync(string sessionIdentity);
    Task<IReadOnlyList<(string Identity, Session Session)>> LoadAllAsync();
}
