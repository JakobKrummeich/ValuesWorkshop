using Microsoft.Extensions.Logging.Abstractions;
using ValuesWorkshop.Application.Formation;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Tests;

public class GroupFormationRunnerTests
{
    private static readonly TimeSpan Window = TimeSpan.FromSeconds(3);

    private readonly ManualTimeProvider clock = new();

    [Fact]
    public void A_session_forming_its_groups_starts_a_run_at_no_progress()
    {
        var session = FormingSession();
        var runner = RunnerOver(new TestGroupSolver());

        runner.EnsureRunningFor(session);

        runner.RunningSessions().ShouldBe([session.Identity]);
        runner.ProgressOf(session.Identity).Value.ShouldBe(0);
    }

    [Fact]
    public void A_session_whose_groups_stand_starts_no_run()
    {
        var runner = RunnerOver(new TestGroupSolver());

        runner.EnsureRunningFor(
            SessionFixtures.InPhase(Phase.GroupFormation, formation: SessionFixtures.TwoGroups())
        );

        runner.RunningSessions().ShouldBeEmpty();
    }

    [Fact]
    public void A_session_in_another_phase_starts_no_run()
    {
        var runner = RunnerOver(new TestGroupSolver());

        runner.EnsureRunningFor(SessionFixtures.InPhase(Phase.SelectionResults));

        runner.RunningSessions().ShouldBeEmpty();
    }

    [Fact]
    public void Progress_advances_with_the_clock()
    {
        var session = FormingSession();
        var runner = RunnerOver(new TestGroupSolver());
        runner.EnsureRunningFor(session);

        clock.Advance(TimeSpan.FromSeconds(1.5));

        runner.ProgressOf(session.Identity).Value.ShouldBe(0.5);
    }

    [Fact]
    public void A_run_whose_clock_has_passed_the_window_reports_the_window_over()
    {
        var session = FormingSession();
        var runner = RunnerOver(new TestGroupSolver());
        runner.EnsureRunningFor(session);

        clock.Advance(TimeSpan.FromSeconds(4));

        runner.IsWindowOverFor(session.Identity).ShouldBeTrue();
    }

    [Fact]
    public void Observing_the_same_session_again_leaves_the_running_clock_alone()
    {
        var session = FormingSession();
        var runner = RunnerOver(new TestGroupSolver());
        runner.EnsureRunningFor(session);
        clock.Advance(TimeSpan.FromSeconds(1.5));

        runner.EnsureRunningFor(session);

        runner.ProgressOf(session.Identity).Value.ShouldBe(0.5);
    }

    [Fact]
    public void A_session_without_a_run_reports_no_progress_and_no_finished_window()
    {
        var runner = RunnerOver(new TestGroupSolver());

        runner.ProgressOf(FormingSession().Identity).Value.ShouldBe(0);
        runner.IsWindowOverFor(FormingSession().Identity).ShouldBeFalse();
    }

    [Fact]
    public void A_dropped_run_is_forgotten()
    {
        var session = FormingSession();
        var runner = RunnerOver(new TestGroupSolver());
        runner.EnsureRunningFor(session);

        runner.Drop(session.Identity);

        runner.RunningSessions().ShouldBeEmpty();
        runner.ProgressOf(session.Identity).Value.ShouldBe(0);
    }

    [Fact]
    public void The_groups_are_formed_from_the_assignment_the_solver_found()
    {
        var runner = RunnerOver(new SplitInTwoGroupSolver());
        runner.EnsureRunningFor(FormingSession());

        var session = FormedOnceTheSolverIsHeard(runner);

        session.Formation.Groups.Select(group => group.Members.Count).ShouldBe([1, 2]);
    }

    [Fact]
    public void The_groups_are_formed_at_random_when_the_solver_is_still_thinking()
    {
        var solver = new BlockedGroupSolver();
        var session = FormingSession();

        try
        {
            var runner = RunnerOver(solver);
            runner.EnsureRunningFor(session);

            runner.FormGroupsIn(session);
        }
        finally
        {
            solver.Release();
        }

        session.Formation.IsFormed.ShouldBeTrue();
        session.Formation.Groups.SelectMany(group => group.Members).Count().ShouldBe(3);
    }

    [Fact]
    public void The_groups_are_formed_at_random_when_the_solver_failed()
    {
        var solver = new FailingGroupSolver();
        var runner = RunnerOver(solver);
        runner.EnsureRunningFor(FormingSession());
        solver.WaitUntilAttempted();

        var session = FormingSession();
        runner.FormGroupsIn(session);

        session.Formation.Groups.SelectMany(group => group.Members).Count().ShouldBe(3);
    }

    [Fact]
    public void Dropping_a_run_cancels_the_solve_it_started()
    {
        var solver = new CancellationWatchingGroupSolver();
        var runner = RunnerOver(solver);
        var session = FormingSession();
        runner.EnsureRunningFor(session);
        solver.WaitUntilAsked();

        runner.Drop(session.Identity);

        solver.WaitUntilCancelled();
    }

    [Fact]
    public void An_assignment_from_a_dropped_run_never_lands_in_the_run_that_replaced_it()
    {
        var solver = new HeldGroupSolver();
        var session = FormingSession();

        try
        {
            var runner = RunnerOver(solver);
            runner.EnsureRunningFor(session);
            solver.WaitUntilAsked();
            runner.Drop(session.Identity);
            runner.EnsureRunningFor(session);

            solver.ReleaseFirstSolve();

            SpinWait
                .SpinUntil(
                    () =>
                    {
                        var candidate = FormingSession();
                        runner.FormGroupsIn(candidate);

                        return candidate.Formation.Groups.Count == 2;
                    },
                    TimeSpan.FromMilliseconds(500)
                )
                .ShouldBeFalse();
        }
        finally
        {
            solver.ReleaseLaterSolves();
        }
    }

    [Fact]
    public void The_solver_is_asked_about_the_whole_room_and_the_top_values()
    {
        var solver = new RecordingGroupSolver();
        var session = FormingSession();

        RunnerOver(solver).EnsureRunningFor(session);

        var request = solver.AwaitedRequest();
        request
            .Participants.Select(participant => participant.ParticipantId)
            .ShouldBe([SessionFixtures.Anna, SessionFixtures.Ben, SessionFixtures.Chris]);
        request.TopValues.ShouldBe(session.Selection.TopValues);
    }

    private static Session FormingSession()
    {
        var session = SessionFixtures.InSelectionResults();
        session.AdvancePhase();

        return session;
    }

    private static Session FormedOnceTheSolverIsHeard(GroupFormationRunner runner)
    {
        Session formed = FormingSession();

        SpinWait
            .SpinUntil(
                () =>
                {
                    formed = FormingSession();
                    runner.FormGroupsIn(formed);

                    return formed.Formation.Groups.Count == 2;
                },
                TimeSpan.FromSeconds(10)
            )
            .ShouldBeTrue();

        return formed;
    }

    private GroupFormationRunner RunnerOver(IGroupSolver groupSolverPort)
    {
        return new GroupFormationRunner(
            groupSolverPort,
            new TestGroupNames(8),
            new FixedRandomness(0),
            clock,
            new GroupFormationWindow(Window),
            NullLogger<GroupFormationRunner>.Instance
        );
    }

    private sealed class SplitInTwoGroupSolver : IGroupSolver
    {
        public GroupFormationResult Solve(
            GroupFormationRequest request,
            CancellationToken cancellationToken
        )
        {
            var members = request
                .Participants.Select(participant => participant.ParticipantId)
                .ToList();

            return new GroupFormationResult([
                new FormedGroup(members.Take(1).ToList(), request.TopValues.Take(1).ToList()),
                new FormedGroup(members.Skip(1).ToList(), request.TopValues.Skip(1).ToList()),
            ]);
        }
    }

    private sealed class CancellationWatchingGroupSolver : IGroupSolver
    {
        private readonly ManualResetEventSlim asked = new();
        private readonly ManualResetEventSlim cancelled = new();

        public GroupFormationResult Solve(
            GroupFormationRequest request,
            CancellationToken cancellationToken
        )
        {
            using var stopWhenCancelled = cancellationToken.Register(cancelled.Set);

            asked.Set();
            cancelled.Wait(TimeSpan.FromSeconds(10));
            cancellationToken.ThrowIfCancellationRequested();

            return new TestGroupSolver().Solve(request, cancellationToken);
        }

        public void WaitUntilAsked()
        {
            asked.Wait(TimeSpan.FromSeconds(10)).ShouldBeTrue();
        }

        public void WaitUntilCancelled()
        {
            cancelled.Wait(TimeSpan.FromSeconds(10)).ShouldBeTrue();
        }
    }

    private sealed class HeldGroupSolver : IGroupSolver
    {
        private readonly ManualResetEventSlim asked = new();
        private readonly ManualResetEventSlim firstSolveReleased = new();
        private readonly ManualResetEventSlim laterSolvesReleased = new();
        private int solves;

        public GroupFormationResult Solve(
            GroupFormationRequest request,
            CancellationToken cancellationToken
        )
        {
            var isFirstSolve = Interlocked.Increment(ref solves) == 1;

            asked.Set();
            (isFirstSolve ? firstSolveReleased : laterSolvesReleased).Wait(
                TimeSpan.FromSeconds(10)
            );

            return isFirstSolve
                ? new SplitInTwoGroupSolver().Solve(request, cancellationToken)
                : new TestGroupSolver().Solve(request, cancellationToken);
        }

        public void WaitUntilAsked()
        {
            asked.Wait(TimeSpan.FromSeconds(10)).ShouldBeTrue();
        }

        public void ReleaseFirstSolve()
        {
            firstSolveReleased.Set();
        }

        public void ReleaseLaterSolves()
        {
            laterSolvesReleased.Set();
        }
    }

    private sealed class BlockedGroupSolver : IGroupSolver
    {
        private readonly ManualResetEventSlim released = new();

        public GroupFormationResult Solve(
            GroupFormationRequest request,
            CancellationToken cancellationToken
        )
        {
            released.Wait();

            return new TestGroupSolver().Solve(request, cancellationToken);
        }

        public void Release()
        {
            released.Set();
        }
    }

    private sealed class FailingGroupSolver : IGroupSolver
    {
        private readonly ManualResetEventSlim attempted = new();

        public GroupFormationResult Solve(
            GroupFormationRequest request,
            CancellationToken cancellationToken
        )
        {
            attempted.Set();

            throw new InvalidOperationException("Group formation found no assignment.");
        }

        public void WaitUntilAttempted()
        {
            attempted.Wait(TimeSpan.FromSeconds(10)).ShouldBeTrue();
        }
    }

    private sealed class RecordingGroupSolver : IGroupSolver
    {
        private readonly TaskCompletionSource<GroupFormationRequest> requested = new();

        public GroupFormationResult Solve(
            GroupFormationRequest request,
            CancellationToken cancellationToken
        )
        {
            requested.SetResult(request);

            return new TestGroupSolver().Solve(request, cancellationToken);
        }

        public GroupFormationRequest AwaitedRequest()
        {
            requested.Task.Wait(TimeSpan.FromSeconds(10)).ShouldBeTrue();

            return requested.Task.Result;
        }
    }
}
