using ValuesWorkshop.Domain;

namespace ValuesWorkshop.TestSupport;

public static class TestValueIds
{
    public static IReadOnlyList<ValueId> Numbered(int firstNumber, int valueCount)
    {
        return Enumerable
            .Range(firstNumber, valueCount)
            .Select(valueNumber => new ValueId($"wert-{valueNumber}"))
            .ToList();
    }
}
