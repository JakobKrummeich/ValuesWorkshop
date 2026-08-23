using ValuesWorkshop.Application.State;

namespace ValuesWorkshop.Application.Tests;

internal static class TestMappers
{
    private static readonly TestQuizCatalog QuizCatalog = new(5);

    private static readonly TestValuesCatalog ValuesCatalog = new(50);

    private static readonly TestAnimalsCatalog AnimalsCatalog = new(8);

    internal static ParticipantWorkshopStateMapper Participant(double formationProgress = 0)
    {
        return new ParticipantWorkshopStateMapper(
            QuizCatalog,
            ValuesCatalog,
            AnimalsCatalog,
            new TestFormationProgress(formationProgress)
        );
    }

    internal static FacilitatorWorkshopStateMapper Facilitator(double formationProgress = 0)
    {
        return new FacilitatorWorkshopStateMapper(
            QuizCatalog,
            ValuesCatalog,
            AnimalsCatalog,
            new TestFormationProgress(formationProgress)
        );
    }

    internal static PresenterWorkshopStateMapper Presenter(double formationProgress = 0)
    {
        return new PresenterWorkshopStateMapper(
            QuizCatalog,
            ValuesCatalog,
            AnimalsCatalog,
            new TestFormationProgress(formationProgress)
        );
    }
}
