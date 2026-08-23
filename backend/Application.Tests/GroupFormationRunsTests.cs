using Microsoft.Extensions.Logging.Abstractions;
using ValuesWorkshop.Application.Formation;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Tests;

public class GroupFormationRunsTests
{
    private static readonly TimeSpan Window = TimeSpan.FromSeconds(3);

    private readonly ManualTimeProvider clock = new();

    [Fact]
    public void A_session_forming_its_groups_starts_a_run_at_no_progress()
    {
        var session = FormingSession();
        var runs = RunsOver(new TestGroupSolver());

        runs.EnsureRunningFor(session);

        runs.RunningSessions().ShouldBe([session.Identity]);
        runs.ProgressOf(session.Identity).Value.ShouldBe(0);
    }

    [Fact]
    public void A_session_whose_groups_stand_starts_no_run()
    {
        var runs = RunsOver(new TestGroupSolver());

        runs.EnsureRunningFor(
            SessionFixtures.InPhase(Phase.GroupFormation, formation: SessionFixtures.TwoGroups())
        );

        runs.RunningSessions().ShouldBeEmpty();
    }

    [Fact]
    public void A_session_in_another_phase_starts_no_run()
    {
        var runs = RunsOver(new TestGroupSolver());

        runs.EnsureRunningFor(SessionFixtures.InPhase(Phase.SelectionResults));

        runs.RunningSessions().ShouldBeEmpty();
    }

    [Fact]
    public void A_window_that_lasts_no_time_is_refused()
    {
        Should.Throw<InvalidOperationException>(() => new GroupFormationWindow(TimeSpan.Zero));
    }

    [Fact]
    public void Progress_advances_with_the_clock()
    {
        var session = FormingSession();
        var runs = RunsOver(new TestGroupSolver());
        runs.EnsureRunningFor(session);

        clock.Advance(TimeSpan.FromSeconds(1.5));

        runs.ProgressOf(session.Identity).Value.ShouldBe(0.5);
    }

    [Fact]
    public void Progress_stops_at_a_full_bar_and_the_window_is_over()
    {
        var session = FormingSession();
        var runs = RunsOver(new TestGroupSolver());
        runs.EnsureRunningFor(session);

        clock.Advance(TimeSpan.FromSeconds(4));

        runs.ProgressOf(session.Identity).Value.ShouldBe(1);
        runs.IsWindowOverFor(session.Identity).ShouldBeTrue();
    }

    [Fact]
    public void The_window_is_not_over_while_the_bar_is_still_moving()
    {
        var session = FormingSession();
        var runs = RunsOver(new TestGroupSolver());
        runs.EnsureRunningFor(session);

        clock.Advance(TimeSpan.FromSeconds(2.999));

        runs.IsWindowOverFor(session.Identity).ShouldBeFalse();
    }

    [Fact]
    public void Observing_the_same_session_again_leaves_the_running_clock_alone()
    {
        var session = FormingSession();
        var runs = RunsOver(new TestGroupSolver());
        runs.EnsureRunningFor(session);
        clock.Advance(TimeSpan.FromSeconds(1.5));

        runs.EnsureRunningFor(session);

        runs.ProgressOf(session.Identity).Value.ShouldBe(0.5);
    }

    [Fact]
    public void A_session_without_a_run_reports_no_progress_and_no_finished_window()
    {
        var runs = RunsOver(new TestGroupSolver());

        runs.ProgressOf(FormingSession().Identity).Value.ShouldBe(0);
        runs.IsWindowOverFor(FormingSession().Identity).ShouldBeFalse();
    }

    [Fact]
    public void A_dropped_run_is_forgotten()
    {
        var session = FormingSession();
        var runs = RunsOver(new TestGroupSolver());
        runs.EnsureRunningFor(session);

        runs.Drop(session.Identity);

        runs.RunningSessions().ShouldBeEmpty();
        runs.ProgressOf(session.Identity).Value.ShouldBe(0);
    }

    [Fact]
    public void The_groups_are_formed_from_the_assignment_the_solver_found()
    {
        var runs = RunsOver(new SplitInTwoGroupSolver());
        runs.EnsureRunningFor(FormingSession());

        var session = FormedOnceTheSolverIsHeard(runs);

        session.Formation.Groups.Select(group => group.Members.Count).ShouldBe([1, 2]);
    }

    [Fact]
    public void The_groups_are_formed_at_random_when_the_solver_is_still_thinking()
    {
        var solver = new BlockedGroupSolver();
        var session = FormingSession();

        try
        {
            var runs = RunsOver(solver);
            runs.EnsureRunningFor(session);

            runs.FormGroupsIn(session);
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
        var runs = RunsOver(solver);
        runs.EnsureRunningFor(FormingSession());
        solver.WaitUntilAttempted();

        var session = FormingSession();
        runs.FormGroupsIn(session);

        session.Formation.Groups.SelectMany(group => group.Members).Count().ShouldBe(3);
    }

    [Fact]
    public void An_assignment_from_a_dropped_run_never_lands_in_the_run_that_replaced_it()
    {
        var solver = new HeldGroupSolver();
        var session = FormingSession();

        try
        {
            var runs = RunsOver(solver);
            runs.EnsureRunningFor(session);
            runs.Drop(session.Identity);
            runs.EnsureRunningFor(session);

            solver.ReleaseFirstSolve();

            SpinWait
                .SpinUntil(
                    () =>
                    {
                        var candidate = FormingSession();
                        runs.FormGroupsIn(candidate);

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

        RunsOver(solver).EnsureRunningFor(session);

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

    private static Session FormedOnceTheSolverIsHeard(GroupFormationRuns runs)
    {
        Session formed = FormingSession();

        SpinWait
            .SpinUntil(
                () =>
                {
                    formed = FormingSession();
                    runs.FormGroupsIn(formed);

                    return formed.Formation.Groups.Count == 2;
                },
                TimeSpan.FromSeconds(10)
            )
            .ShouldBeTrue();

        return formed;
    }

    private GroupFormationRuns RunsOver(IGroupSolver groupSolverPort)
    {
        return new GroupFormationRuns(
            groupSolverPort,
            new TestGroupNames(8),
            new FixedRandomness(0),
            clock,
            new GroupFormationWindow(Window),
            NullLogger<GroupFormationRuns>.Instance
        );
    }

    private sealed class SplitInTwoGroupSolver : IGroupSolver
    {
        public GroupFormationResult Solve(GroupFormationRequest request)
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

    private sealed class HeldGroupSolver : IGroupSolver
    {
        private readonly ManualResetEventSlim firstSolveReleased = new();
        private readonly ManualResetEventSlim laterSolvesReleased = new();
        private int solves;

        public GroupFormationResult Solve(GroupFormationRequest request)
        {
            var isFirstSolve = Interlocked.Increment(ref solves) == 1;

            (isFirstSolve ? firstSolveReleased : laterSolvesReleased).Wait(
                TimeSpan.FromSeconds(10)
            );

            return isFirstSolve
                ? new SplitInTwoGroupSolver().Solve(request)
                : new TestGroupSolver().Solve(request);
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

        public GroupFormationResult Solve(GroupFormationRequest request)
        {
            released.Wait();

            return new TestGroupSolver().Solve(request);
        }

        public void Release()
        {
            released.Set();
        }
    }

    private sealed class FailingGroupSolver : IGroupSolver
    {
        private readonly ManualResetEventSlim attempted = new();

        public GroupFormationResult Solve(GroupFormationRequest request)
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

        public GroupFormationResult Solve(GroupFormationRequest request)
        {
            requested.SetResult(request);

            return new TestGroupSolver().Solve(request);
        }

        public GroupFormationRequest AwaitedRequest()
        {
            requested.Task.Wait(TimeSpan.FromSeconds(10)).ShouldBeTrue();

            return requested.Task.Result;
        }
    }
}
