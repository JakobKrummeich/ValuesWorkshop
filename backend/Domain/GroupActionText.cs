using System.Globalization;

namespace ValuesWorkshop.Domain;

public sealed record GroupActionText
{
    private const int MaximumLength = 200;

    public string Value { get; }

    public bool IsEmpty => Value.Length == 0;

    private GroupActionText(string value)
    {
        Value = value;
    }

    public static GroupActionText Of(string? candidate)
    {
        var trimmed = candidate?.Trim() ?? string.Empty;

        if (trimmed.Length == 0)
        {
            return new GroupActionText(string.Empty);
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
