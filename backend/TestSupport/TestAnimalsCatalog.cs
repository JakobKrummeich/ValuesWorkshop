using ValuesWorkshop.Application.Ports.Driven;

namespace ValuesWorkshop.TestSupport;

public sealed class TestAnimalsCatalog(int animalCount) : IAnimalsCatalog
{
    public IReadOnlyList<WorkshopAnimal> Animals { get; } =
        Enumerable
            .Range(1, animalCount)
            .Select(number => new WorkshopAnimal(
                $"tier-{number}",
                new LocalizedText($"Tier {number}", $"Animal {number}")
            ))
            .ToList();
}
