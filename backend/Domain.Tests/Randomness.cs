namespace ValuesWorkshop.Domain.Tests;

internal static class Randomness
{
    internal static IRandomness Fixed(int index)
    {
        return new FixedRandomness(index);
    }

    private sealed class FixedRandomness(int index) : IRandomness
    {
        public int NextIndex(int exclusiveUpperBound)
        {
            return index % exclusiveUpperBound;
        }
    }
}
