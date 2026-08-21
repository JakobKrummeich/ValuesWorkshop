using System.Globalization;

namespace ValuesWorkshop.Domain;

public sealed record GroupActionText
{
    private const int MaximumLength = 200;

    public string Value { get; }

    private GroupActionText(string value)
    {
        Value = value;
    }

    public static GroupActionText Of(string? candidate)
    {
        var trimmed = candidate?.Trim() ?? string.Empty;

        if (trimmed.Length == 0)
        {
            throw new MalformedPayloadException("An action needs a text.");
        }

        return new GroupActionText(TruncatedToTextElements(trimmed));
    }

    private static string TruncatedToTextElements(string trimmed)
    {
        var textElements = new StringInfo(trimmed);

        return textElements.LengthInTextElements <= MaximumLength
            ? trimmed
            : textElements.SubstringByTextElements(0, MaximumLength);
    }
}
