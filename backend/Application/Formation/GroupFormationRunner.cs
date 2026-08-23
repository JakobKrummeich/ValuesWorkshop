using Microsoft.Extensions.Logging;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Formation;

public sealed class GroupFormationRunner(
    IGroupSolver groupSolverPort,
    IGroupNames groupNamesPort,
    IRandomness randomnessPort,
    TimeProvider timeProviderPort,
    GroupFormationWindow window,
    ILogger<GroupFormationRunner> logger
) : IGroupFormationProgress
{
    private sealed record GroupFormationRun(
        Guid Token,
        long StartedAt,
        CancellationTokenSource Cancellation,
        GroupFormationResult? Assignment
    );

    private readonly Lock gate = new();
    private readonly Dictionary<SessionIdentity, GroupFormationRun> runs = [];

    public void EnsureRunningFor(Session session)
    {
        if (!session.IsFormingGroups)
        {
            return;
        }

        var token = Guid.NewGuid();
        var cancellation = new CancellationTokenSource();

        lock (gate)
        {
            if (
                !runs.TryAdd(
                    session.Identity,
                    new GroupFormationRun(
                        token,
                        timeProviderPort.GetTimestamp(),
                        cancellation,
                        null
                    )
                )
            )
            {
                cancellation.Dispose();

                return;
            }
        }

        var request = GroupFormationRequest.For(session);

        _ = Task.Run(() => SolveFor(session.Identity, token, request, cancellation.Token));
    }

    public FormationProgress ProgressOf(SessionIdentity sessionIdentity)
    {
        lock (gate)
        {
            return new FormationProgress(
                runs.TryGetValue(sessionIdentity, out var run) ? ElapsedFractionOf(run) : 0
            );
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
        session.FormGroups(AssignmentFor(session), groupNamesPort.Names, randomnessPort);
    }

    public void Drop(SessionIdentity sessionIdentity)
    {
        GroupFormationRun? dropped;

        lock (gate)
        {
            runs.Remove(sessionIdentity, out dropped);
        }

        dropped?.Cancellation.Cancel();
    }

    public void RetainOnly(IReadOnlyCollection<SessionIdentity> sessionIdentities)
    {
        foreach (var sessionIdentity in RunningSessions())
        {
            if (!sessionIdentities.Contains(sessionIdentity))
            {
                Drop(sessionIdentity);
            }
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

        return RandomGroupAssignment.For(GroupFormationRequest.For(session), randomnessPort);
    }

    private void SolveFor(
        SessionIdentity sessionIdentity,
        Guid token,
        GroupFormationRequest request,
        CancellationToken cancellationToken
    )
    {
        GroupFormationResult? assignment = null;

        try
        {
            assignment = groupSolverPort.Solve(request, cancellationToken);
        }
        catch (OperationCanceledException)
        {
            return;
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "The group solver failed to find an assignment.");
        }

        lock (gate)
        {
            if (
                assignment is not null
                && runs.TryGetValue(sessionIdentity, out var run)
                && run.Token == token
            )
            {
                runs[sessionIdentity] = run with { Assignment = assignment };
            }
        }
    }

    private double ElapsedFractionOf(GroupFormationRun run)
    {
        return Math.Clamp(timeProviderPort.GetElapsedTime(run.StartedAt) / window.Value, 0, 1);
    }
}
