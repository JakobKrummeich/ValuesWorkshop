using Microsoft.Extensions.Logging;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Formation;

public sealed record GroupFormationWindow(TimeSpan Value);

public sealed class GroupFormationRuns(
    IGroupSolver groupSolverPort,
    IGroupNames groupNamesPort,
    IRandomness randomness,
    TimeProvider timeProvider,
    GroupFormationWindow window,
    ILogger<GroupFormationRuns> logger
) : IGroupFormationProgress
{
    private sealed record GroupFormationRun(long StartedAt, GroupFormationResult? Assignment);

    private readonly Lock gate = new();
    private readonly Dictionary<SessionIdentity, GroupFormationRun> runs = [];

    public void EnsureRunningFor(Session session)
    {
        if (!session.IsFormingGroups)
        {
            return;
        }

        var request = RequestFrom(session);

        lock (gate)
        {
            if (
                !runs.TryAdd(
                    session.Identity,
                    new GroupFormationRun(timeProvider.GetTimestamp(), null)
                )
            )
            {
                return;
            }
        }

        _ = Task.Run(() => SolveFor(session.Identity, request));
    }

    public double ProgressOf(SessionIdentity sessionIdentity)
    {
        lock (gate)
        {
            return runs.TryGetValue(sessionIdentity, out var run) ? ElapsedFractionOf(run) : 0;
        }
    }

    public bool IsWindowOverFor(SessionIdentity sessionIdentity)
    {
        lock (gate)
        {
            return runs.TryGetValue(sessionIdentity, out var run) && ElapsedFractionOf(run) >= 1;
        }
    }

    public IReadOnlyList<SessionIdentity> RunningSessions()
    {
        lock (gate)
        {
            return runs.Keys.ToList();
        }
    }

    public void FormGroupsIn(Session session)
    {
        session.FormGroups(AssignmentFor(session), groupNamesPort.Names, randomness);
    }

    public void Drop(SessionIdentity sessionIdentity)
    {
        lock (gate)
        {
            runs.Remove(sessionIdentity);
        }
    }

    private GroupFormationResult AssignmentFor(Session session)
    {
        lock (gate)
        {
            if (runs.GetValueOrDefault(session.Identity)?.Assignment is { } solved)
            {
                return solved;
            }
        }

        logger.LogInformation(
            "The group solver had no assignment ready in time; a random assignment is used instead."
        );

        return RandomGroupAssignment.For(RequestFrom(session), randomness);
    }

    private void SolveFor(SessionIdentity sessionIdentity, GroupFormationRequest request)
    {
        GroupFormationResult? assignment = null;

        try
        {
            assignment = groupSolverPort.Solve(request);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "The group solver failed to find an assignment.");
        }

        lock (gate)
        {
            if (assignment is not null && runs.TryGetValue(sessionIdentity, out var run))
            {
                runs[sessionIdentity] = run with { Assignment = assignment };
            }
        }
    }

    private double ElapsedFractionOf(GroupFormationRun run)
    {
        return Math.Clamp(timeProvider.GetElapsedTime(run.StartedAt) / window.Value, 0, 1);
    }

    private static GroupFormationRequest RequestFrom(Session session)
    {
        var participants = session
            .Roster.Participants.Select(participant => new ParticipantSelection(
                participant.Id,
                session.Selection.SelectedValuesOf(participant.Id)
            ))
            .ToList();

        return new GroupFormationRequest(participants, session.Selection.TopValues);
    }
}
