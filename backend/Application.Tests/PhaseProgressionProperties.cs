using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using ValuesWorkshop.Application.Intents;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Tests;

public class PhaseProgressionProperties
{
    [Property]
    public Property The_phase_only_ever_moves_forward_and_never_by_more_than_one_step()
    {
        return Prop.ForAll(
            ArbMap.Default.ArbFor<Phase>(),
            ArbMap.Default.ArbFor<WorkshopIntentKind[]>(),
            (startingPhase, intentKinds) =>
            {
                var repository = new StoredSessionRepository(SessionAt(startingPhase));
                var driver = new WorkshopIntentDriver(repository);

                foreach (var intentKind in intentKinds)
                {
                    ShouldOnlyMoveForward(repository, () => driver.Execute(intentKind));
                }
            }
        );
    }

    [Property]
    public Property A_refused_intent_leaves_the_phase_and_the_revision_exactly_where_they_were()
    {
        return Prop.ForAll(
            ArbMap.Default.ArbFor<Phase>(),
            ArbMap.Default.ArbFor<WorkshopIntentKind[]>(),
            (startingPhase, intentKinds) =>
            {
                var repository = new StoredSessionRepository(SessionAt(startingPhase));
                var driver = new WorkshopIntentDriver(repository);

                foreach (var intentKind in intentKinds)
                {
                    ShouldChangeNothingWhenRefused(repository, () => driver.Execute(intentKind));
                }
            }
        );
    }

    private static void ShouldOnlyMoveForward(
        StoredSessionRepository repository,
        Func<IntentResult> execute
    )
    {
        var (phaseBefore, revisionBefore) = StateOf(repository);

        execute();

        var (phaseAfter, revisionAfter) = StateOf(repository);
        (phaseAfter - phaseBefore).ShouldBeInRange(0, 1);
        (revisionAfter - revisionBefore).ShouldBeInRange(0, 1);

        if (phaseAfter != phaseBefore)
        {
            revisionAfter.ShouldBe(revisionBefore + 1);
        }
    }

    private static void ShouldChangeNothingWhenRefused(
        StoredSessionRepository repository,
        Func<IntentResult> execute
    )
    {
        var (phaseBefore, revisionBefore) = StateOf(repository);

        var result = execute();

        var (phaseAfter, revisionAfter) = StateOf(repository);

        if (result.IsAccepted)
        {
            return;
        }

        phaseAfter.ShouldBe(phaseBefore);
        revisionAfter.ShouldBe(revisionBefore);
    }

    private static (Phase Phase, long Revision) StateOf(StoredSessionRepository repository)
    {
        return (repository.Stored.PhaseProgress.CurrentPhase, repository.Stored.Revision);
    }

    private static Session SessionAt(Phase startingPhase)
    {
        return SessionFixtures.InPhase(
            startingPhase,
            selection: SelectionRound.Restore([], TestValueIds.Numbered(1, 2)),
            formation: SessionFixtures.TwoGroups(),
            voting: TestVoting.MainRoundOpen(TestValueIds.Numbered(1, 6))
        );
    }
}
