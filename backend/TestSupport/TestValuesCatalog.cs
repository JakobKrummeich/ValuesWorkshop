using ValuesWorkshop.Application.Ports.Driven;

namespace ValuesWorkshop.TestSupport;

public sealed class TestValuesCatalog(int valueCount) : IValuesCatalog
{
    public IReadOnlyList<WorkshopValue> Values { get; } =
        Enumerable
            .Range(1, valueCount)
            .Select(valueNumber => new WorkshopValue(
                $"wert-{valueNumber}",
                new LocalizedText($"Wert {valueNumber}", $"Value {valueNumber}")
            ))
            .ToList();
}
