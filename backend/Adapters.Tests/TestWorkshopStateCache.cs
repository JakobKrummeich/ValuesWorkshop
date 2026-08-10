using ValuesWorkshop.Adapters.Web;
using ValuesWorkshop.Application.State;

namespace ValuesWorkshop.Adapters.Tests;

internal static class TestWorkshopStateCache
{
    internal static WorkshopStateCache Create()
    {
        var catalog = new TestQuizCatalog(5);

        return new WorkshopStateCache(
            new FacilitatorWorkshopStateMapper(catalog, TestExitGuards.RegisteredFor(catalog)),
            new PresenterWorkshopStateMapper(catalog),
            new ParticipantWorkshopStateMapper(catalog)
        );
    }
}
