using System.Security.Cryptography;
using System.Text;
using ValuesWorkshop.Application.Ports.Driven;

namespace ValuesWorkshop.Host.Auth;

public sealed class FacilitatorPassphrase : IFacilitatorPassphrase
{
    private readonly byte[] configuredDigest;

    public FacilitatorPassphrase(string? configuredPassphrase)
    {
        if (string.IsNullOrWhiteSpace(configuredPassphrase))
        {
            throw new InvalidOperationException(
                "FACILITATOR_PASSPHRASE must be set to a non-empty value."
            );
        }

        configuredDigest = DigestOf(configuredPassphrase);
    }

    public bool Matches(string candidate)
    {
        return CryptographicOperations.FixedTimeEquals(configuredDigest, DigestOf(candidate));
    }

    private static byte[] DigestOf(string value)
    {
        return SHA256.HashData(Encoding.UTF8.GetBytes(value));
    }
}
