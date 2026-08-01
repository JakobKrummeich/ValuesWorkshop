namespace ValuesWorkshop.Domain.Ports;

public interface ISessionRepository
{
    Task CreateAsync(Session session);
    Task SaveAsync(Session session, long expectedRevision);
    Task<Session?> LoadAsync(SessionIdentity sessionIdentity);
    Task<IReadOnlyList<Session>> LoadAllAsync();
}
