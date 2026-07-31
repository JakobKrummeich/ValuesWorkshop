using System.Security.Cryptography;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Host;

internal sealed class SystemRandomness : IRandomness
{
    public int NextIndex(int exclusiveUpperBound)
    {
        return RandomNumberGenerator.GetInt32(exclusiveUpperBound);
    }
}
