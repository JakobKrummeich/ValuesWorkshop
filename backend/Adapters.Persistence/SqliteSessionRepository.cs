using System.Globalization;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Adapters.Persistence;

public sealed class SqliteSessionRepository(WorkshopDbContext database) : ISessionRepository
{
    private const int SqliteBusyErrorCode = 5;

    public async Task SaveAsync(Session session, long expectedRevision)
    {
        try
        {
            await SaveWithinTransactionAsync(session, expectedRevision);
        }
        catch (SqliteException exception) when (exception.SqliteErrorCode == SqliteBusyErrorCode)
        {
            throw new ConcurrencyConflictException(
                DescribeMissingWriteLock(session.Identity, expectedRevision),
                exception
            );
        }
    }

    private async Task SaveWithinTransactionAsync(Session session, long expectedRevision)
    {
        var identityString = session.Identity.Value.ToString();

        database.ChangeTracker.Clear();

        await using var transaction = await database.Database.BeginTransactionAsync();

        var claimedRows = await database
            .Sessions.Where(sessionEntity =>
                sessionEntity.Identity == identityString
                && sessionEntity.Revision == expectedRevision
            )
            .ExecuteUpdateAsync(setters =>
                setters.SetProperty(sessionEntity => sessionEntity.Revision, session.Revision)
            );

        if (claimedRows == 0)
        {
            await RequireInsertableSession(session.Identity, expectedRevision);
        }

        var existingEntity = await QueryFullSession()
            .FirstOrDefaultAsync(sessionEntity => sessionEntity.Identity == identityString);

        var newEntity = DomainEntityMapper.ToEntity(session);

        if (existingEntity is not null)
        {
            newEntity.CreatedAt = existingEntity.CreatedAt;
            RemoveExistingChildren(existingEntity);
            database.Sessions.Remove(existingEntity);
            await database.SaveChangesAsync();
        }

        database.Sessions.Add(newEntity);
        await database.SaveChangesAsync();

        await transaction.CommitAsync();
    }

    public async Task<Session?> LoadAsync(SessionIdentity sessionIdentity)
    {
        var identityString = sessionIdentity.Value.ToString();

        var entity = await QueryFullSession()
            .AsNoTracking()
            .FirstOrDefaultAsync(sessionEntity => sessionEntity.Identity == identityString);

        return entity is null ? null : DomainEntityMapper.ToDomain(entity);
    }

    public async Task<IReadOnlyList<Session>> LoadAllAsync()
    {
        var entities = await QueryFullSession().AsNoTracking().ToListAsync();

        return entities.Select(DomainEntityMapper.ToDomain).ToList();
    }

    private static string DescribeMissingWriteLock(
        SessionIdentity sessionIdentity,
        long expectedRevision
    )
    {
        return string.Create(
            CultureInfo.InvariantCulture,
            $"Session {sessionIdentity.Value} expected revision {expectedRevision} but the write lock was not obtained before the timeout elapsed."
        );
    }

    private async Task RequireInsertableSession(
        SessionIdentity sessionIdentity,
        long expectedRevision
    )
    {
        var identityString = sessionIdentity.Value.ToString();

        var storedRevision = await database
            .Sessions.AsNoTracking()
            .Where(sessionEntity => sessionEntity.Identity == identityString)
            .Select(sessionEntity => (long?)sessionEntity.Revision)
            .FirstOrDefaultAsync();

        if (storedRevision is null && expectedRevision == 0)
        {
            return;
        }

        throw new ConcurrencyConflictException(sessionIdentity, expectedRevision, storedRevision);
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
