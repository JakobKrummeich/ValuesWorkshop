using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Application.Tests;

internal sealed class FakeSessionRepository(Func<Session?> load) : ISessionRepository
{
    internal List<Session> Saved { get; } = [];
    internal List<long> ExpectedRevisions { get; } = [];
    internal int Loads { get; private set; }
    internal int ConflictingSaves { get; set; }

    internal static FakeSessionRepository Holding(Session session)
    {
        return new FakeSessionRepository(() => SnapshotOf(session));
    }

    private static Session SnapshotOf(Session session)
    {
        return Session.Restore(
            session.Identity,
            Roster.Restore(session.Roster.Participants),
            PhaseProgress.Restore(session.PhaseProgress.CurrentPhase),
            QuizProgress.Restore(
                session.Quiz.CurrentQuestion,
                session.Quiz.IsRevealed,
                session.Quiz.IsLearningTextShown
            ),
            SelectionRound.Restore(session.Selection.SubmittedBy, session.Selection.TopValues),
            FormationRecord.Restore(
                session.Formation.IsFormed,
                session.Formation.Groups.Select(SnapshotOf)
            ),
            PresentationWalk.Restore(
                session.Presentation.PresentingGroup,
                session.Presentation.PresentedValue
            ),
            VotingRounds.Restore(
                session.Voting.RoundOpen,
                session.Voting.RoundNumber,
                session.Voting.WinningValues
            ),
            session.Revision
        );
    }

    private static Group SnapshotOf(Group group)
    {
        return Group.Restore(
            group.Name,
            [.. group.Members],
            [.. group.AssignedValues],
            group.Scribe,
            group.IsSubmitted
        );
    }

    internal static FakeSessionRepository Empty()
    {
        return new FakeSessionRepository(() => null);
    }

    public Task<Session?> LoadAsync(SessionIdentity sessionIdentity)
    {
        Loads++;

        return Task.FromResult(load());
    }

    public Task SaveAsync(Session session, long expectedRevision)
    {
        ExpectedRevisions.Add(expectedRevision);

        if (ConflictingSaves > 0)
        {
            ConflictingSaves--;

            throw new ConcurrencyConflictException(
                session.Identity,
                expectedRevision,
                storedRevision: null
            );
        }

        Saved.Add(session);

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<Session>> LoadAllAsync()
    {
        return Task.FromResult<IReadOnlyList<Session>>(load() is { } session ? [session] : []);
    }
}
