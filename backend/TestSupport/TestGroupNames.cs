using ValuesWorkshop.Domain;

namespace ValuesWorkshop.TestSupport;

public sealed class TestGroupNames(int nameCount) : IGroupNames
{
    public IReadOnlyList<string> Names { get; } =
        Enumerable.Range(1, nameCount).Select(number => $"tier-{number}").ToList();
}
