using Microsoft.EntityFrameworkCore;
using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Adapters.Persistence;

public sealed class SqliteSessionRepository(WorkshopDbContext database) : ISessionRepository
{
    public async Task SaveAsync(string sessionIdentity, Session session)
    {
        var existingEntity = await QueryFullSession()
            .FirstOrDefaultAsync(sessionEntity => sessionEntity.Identity == sessionIdentity);

        var newEntity = DomainEntityMapper.ToEntity(sessionIdentity, session);

        if (existingEntity is not null)
        {
            newEntity.CreatedAt = existingEntity.CreatedAt;
            RemoveExistingChildren(existingEntity);
            database.Sessions.Remove(existingEntity);
            await database.SaveChangesAsync();
        }

        database.Sessions.Add(newEntity);
        await database.SaveChangesAsync();
    }

    public async Task<Session?> LoadAsync(string sessionIdentity)
    {
        var entity = await QueryFullSession()
            .FirstOrDefaultAsync(sessionEntity => sessionEntity.Identity == sessionIdentity);

        return entity is null ? null : DomainEntityMapper.ToDomain(entity);
    }

    public async Task<IReadOnlyList<(string Identity, Session Session)>> LoadAllAsync()
    {
        var entities = await QueryFullSession().ToListAsync();

        return entities
            .Select(entity => (entity.Identity, DomainEntityMapper.ToDomain(entity)))
            .ToList();
    }

    private IQueryable<Persistence.Entities.SessionEntity> QueryFullSession()
    {
        return database
            .Sessions.Include(sessionEntity => sessionEntity.QuizState)
            .Include(sessionEntity => sessionEntity.PresentationState)
            .Include(sessionEntity => sessionEntity.VotingState)
            .Include(sessionEntity => sessionEntity.Participants)
            .Include(sessionEntity => sessionEntity.QuizAnswers)
            .Include(sessionEntity => sessionEntity.ValueSelections)
            .Include(sessionEntity => sessionEntity.SelectionSubmissions)
            .Include(sessionEntity => sessionEntity.TopValues)
            .Include(sessionEntity => sessionEntity.Groups)
                .ThenInclude(groupEntity => groupEntity.Members)
            .Include(sessionEntity => sessionEntity.Groups)
                .ThenInclude(groupEntity => groupEntity.AssignedValues)
            .Include(sessionEntity => sessionEntity.Groups)
                .ThenInclude(groupEntity => groupEntity.Actions)
            .Include(sessionEntity => sessionEntity.VoteTallies)
            .Include(sessionEntity => sessionEntity.VotedParticipants)
            .Include(sessionEntity => sessionEntity.WinningValues);
    }

    private void RemoveExistingChildren(Persistence.Entities.SessionEntity entity)
    {
        database.RemoveRange(entity.Participants);
        database.RemoveRange(entity.QuizAnswers);
        database.RemoveRange(entity.ValueSelections);
        database.RemoveRange(entity.SelectionSubmissions);
        database.RemoveRange(entity.TopValues);
        database.RemoveRange(entity.VoteTallies);
        database.RemoveRange(entity.VotedParticipants);
        database.RemoveRange(entity.WinningValues);

        foreach (var group in entity.Groups)
        {
            database.RemoveRange(group.Members);
            database.RemoveRange(group.AssignedValues);
            database.RemoveRange(group.Actions);
        }

        database.RemoveRange(entity.Groups);

        if (entity.QuizState is not null)
            database.Remove(entity.QuizState);
        if (entity.PresentationState is not null)
            database.Remove(entity.PresentationState);
        if (entity.VotingState is not null)
            database.Remove(entity.VotingState);
    }
}
