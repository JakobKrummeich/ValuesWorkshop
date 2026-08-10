using ValuesWorkshop.Adapters.Web;
using ValuesWorkshop.Application;
using ValuesWorkshop.Application.State;

namespace ValuesWorkshop.Adapters.Tests;

internal static class TestWorkshopStateCache
{
    internal static WorkshopStateCache Create()
    {
        var catalog = new TestQuizCatalog(5);
        var valuesCatalog = new TestValuesCatalog(50);

        return new WorkshopStateCache(
            new FacilitatorWorkshopStateMapper(
                catalog,
                valuesCatalog,
                RegisteredExitGuards.For(catalog)
            ),
            new PresenterWorkshopStateMapper(catalog, valuesCatalog),
            new ParticipantWorkshopStateMapper(catalog, valuesCatalog)
        );
    }
}
