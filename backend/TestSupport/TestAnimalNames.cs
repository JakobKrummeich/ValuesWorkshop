using ValuesWorkshop.Domain;

namespace ValuesWorkshop.TestSupport;

public sealed class TestAnimalNames(int animalCount) : IAnimalNames
{
    public IReadOnlyList<string> Names { get; } =
        Enumerable.Range(1, animalCount).Select(number => $"tier-{number}").ToList();
}
