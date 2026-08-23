using Microsoft.Extensions.Logging.Abstractions;
using ValuesWorkshop.Adapters.Web;
using ValuesWorkshop.Application;
using ValuesWorkshop.Application.Formation;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Tests;

internal static class TestWorkshopStateCache
{
    internal static WorkshopStateCache Create()
    {
        return Create(FormationRuns(new TestGroupSolver(), TimeProvider.System));
    }

    internal static WorkshopStateCache Create(GroupFormationRuns formationRuns)
    {
        var catalog = new TestQuizCatalog(5);
        var valuesCatalog = new TestValuesCatalog(50);
        var animalsCatalog = new TestAnimalsCatalog(8);

        return new WorkshopStateCache(
            new FacilitatorWorkshopStateMapper(
                catalog,
                valuesCatalog,
                animalsCatalog,
                formationRuns
            ),
            new PresenterWorkshopStateMapper(catalog, valuesCatalog, animalsCatalog, formationRuns),
            new ParticipantWorkshopStateMapper(
                catalog,
                valuesCatalog,
                animalsCatalog,
                formationRuns
            ),
            formationRuns
        );
    }

    internal static GroupFormationRuns FormationRuns(
        IGroupSolver groupSolverPort,
        TimeProvider timeProvider
    )
    {
        return new GroupFormationRuns(
            groupSolverPort,
            new TestGroupNames(8),
            new FixedRandomness(0),
            timeProvider,
            new GroupFormationWindow(TimeSpan.FromSeconds(3)),
            NullLogger<GroupFormationRuns>.Instance
        );
    }
}
