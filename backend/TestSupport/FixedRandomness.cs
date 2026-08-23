using ValuesWorkshop.Domain;

namespace ValuesWorkshop.TestSupport;

public sealed class FixedRandomness(int index) : IRandomness
{
    public int NextIndex(int exclusiveUpperBound)
    {
        return index % exclusiveUpperBound;
    }
}
