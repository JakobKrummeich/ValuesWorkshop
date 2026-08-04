using System.Globalization;

namespace ValuesWorkshop.Domain;

public sealed record ParticipantName
{
    private const int MaximumLength = 80;
    private const int FallbackHexLength = 6;

    public string Value { get; }

    private ParticipantName(string value)
    {
        Value = value;
    }

    public static ParticipantName Of(string? candidate, ParticipantId participantId)
    {
        var trimmed = candidate?.Trim() ?? string.Empty;

        if (trimmed.Length == 0)
        {
            return new ParticipantName(FallbackLabelFor(participantId));
        }

        return new ParticipantName(
            trimmed.Length <= MaximumLength ? trimmed : trimmed[..MaximumLength]
        );
    }

    private static string FallbackLabelFor(ParticipantId participantId)
    {
        var hexadecimal = participantId.Value.ToString("N", CultureInfo.InvariantCulture);

        return $"#{hexadecimal[..FallbackHexLength]}";
    }
}
