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
    private static readonly TimeSpan HandOverGracePeriod = TimeSpan.FromMilliseconds(250);

    private sealed record GroupFormationRun(
        Guid Token,
        long StartedAt,
        CancellationTokenSource Cancellation,
        Task Solving,
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

        lock (gate)
        {
            if (runs.ContainsKey(session.Identity))
            {
                return;
            }

            runs[session.Identity] = StartRunFor(session);
        }
    }

    public FormationProgress ProgressOf(SessionIdentity sessionIdentity)
    {
        lock (gate)
        {
            return runs.TryGetValue(sessionIdentity, out var run)
                ? ProgressOf(run)
                : FormationProgress.NotStarted;
        }
    }

    public bool IsWindowOverFor(SessionIdentity sessionIdentity)
    {
        lock (gate)
        {
            return runs.TryGetValue(sessionIdentity, out var run) && ProgressOf(run).IsWindowOver;
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
        dropped?.Cancellation.Dispose();
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

    private GroupFormationRun StartRunFor(Session session)
    {
        var token = Guid.NewGuid();
        var cancellation = new CancellationTokenSource();
        var request = GroupFormationRequest.For(session);

        return new GroupFormationRun(
            token,
            timeProviderPort.GetTimestamp(),
            cancellation,
            Task.Run(() => SolveFor(session.Identity, token, request, cancellation.Token)),
            null
        );
    }

    private GroupFormationResult AssignmentFor(Session session)
    {
        if (AssignmentOf(session.Identity) is { } finished)
        {
            return finished;
        }

        StopSolvingFor(session.Identity)?.Solving.Wait(HandOverGracePeriod);

        if (AssignmentOf(session.Identity) is { } handedOver)
        {
            logger.LogInformation(
                "The group solver did not finish within the formation window; its best assignment so far is used."
            );

            return handedOver;
        }

        logger.LogInformation(
            "The group solver had no assignment ready in time; a random assignment is used instead."
        );

        return RandomGroupAssignment.For(GroupFormationRequest.For(session), randomnessPort);
    }

    private GroupFormationResult? AssignmentOf(SessionIdentity sessionIdentity)
    {
        lock (gate)
        {
            return runs.GetValueOrDefault(sessionIdentity)?.Assignment;
        }
    }

    private GroupFormationRun? StopSolvingFor(SessionIdentity sessionIdentity)
    {
        lock (gate)
        {
            var run = runs.GetValueOrDefault(sessionIdentity);
            run?.Cancellation.Cancel();

            return run;
        }
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
            if (
                groupSolverPort.Solve(request, cancellationToken) is GroupSolverOutcome.Assigned
                {
                    Assignment: var solved
                }
            )
            {
                assignment = solved;
            }
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

    private FormationProgress ProgressOf(GroupFormationRun run)
    {
        return window.ProgressAfter(timeProviderPort.GetElapsedTime(run.StartedAt));
    }
}
