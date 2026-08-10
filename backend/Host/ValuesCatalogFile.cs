using System.Text.Json;
using ValuesWorkshop.Application.Ports.Driven;

namespace ValuesWorkshop.Host;

public sealed class ValuesCatalogFile : IValuesCatalog
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public IReadOnlyList<WorkshopValue> Values { get; }

    private ValuesCatalogFile(IReadOnlyList<WorkshopValue> values)
    {
        Values = values;
    }

    public static ValuesCatalogFile LoadFrom(string path)
    {
        if (!File.Exists(path))
        {
            throw new InvalidOperationException($"Values content file '{path}' does not exist.");
        }

        FileDocument? document;
        try
        {
            document = JsonSerializer.Deserialize<FileDocument>(
                File.ReadAllText(path),
                SerializerOptions
            );
        }
        catch (JsonException exception)
        {
            throw new InvalidOperationException(
                $"Values content file '{path}' is not valid JSON.",
                exception
            );
        }

        if (document?.Values is not { Count: > 0 } fileValues)
        {
            throw new InvalidOperationException(
                $"Values content file '{path}' contains no values."
            );
        }

        var values = fileValues
            .Select((fileValue, valueIndex) => ToValue(fileValue, valueIndex))
            .ToList();

        var duplicateId = values
            .GroupBy(value => value.ValueId)
            .FirstOrDefault(group => group.Count() > 1)
            ?.Key;

        if (duplicateId is not null)
        {
            throw new InvalidOperationException(
                $"Values content: the id '{duplicateId}' duplicates another value."
            );
        }

        return new ValuesCatalogFile(values);
    }

    private static WorkshopValue ToValue(FileValue fileValue, int valueIndex)
    {
        if (string.IsNullOrWhiteSpace(fileValue.Id))
        {
            throw new InvalidOperationException(
                $"Values content: value {valueIndex} needs a non-empty id."
            );
        }

        var translation = fileValue.Translation;

        if (
            translation is null
            || string.IsNullOrWhiteSpace(translation.De)
            || string.IsNullOrWhiteSpace(translation.En)
        )
        {
            throw new InvalidOperationException(
                $"Values content: value {valueIndex} ('{fileValue.Id}') needs non-empty text in both locales."
            );
        }

        return new WorkshopValue(fileValue.Id, new LocalizedText(translation.De, translation.En));
    }

    private sealed record FileDocument(List<FileValue>? Values);

    private sealed record FileValue(string? Id, FileText? Translation);

    private sealed record FileText(string? De, string? En);
}
