namespace ValuesWorkshop.Domain.Ports;

public interface ISessionRepository
{
    Task SaveAsync(Session session);
    Task<Session?> LoadAsync(SessionIdentity sessionIdentity);
    Task<IReadOnlyList<Session>> LoadAllAsync();
}
