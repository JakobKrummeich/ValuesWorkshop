using System.Text.Json;
using ValuesWorkshop.Application.Ports.Driven;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Host;

public sealed class AnimalsCatalogFile : IAnimalsCatalog, IAnimalNames
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public IReadOnlyList<WorkshopAnimal> Animals { get; }

    public IReadOnlyList<string> Names { get; }

    private AnimalsCatalogFile(IReadOnlyList<WorkshopAnimal> animals)
    {
        Animals = animals;
        Names = animals.Select(animal => animal.AnimalId).ToList();
    }

    public static AnimalsCatalogFile LoadFrom(string path)
    {
        if (!File.Exists(path))
        {
            throw new InvalidOperationException($"Animals content file '{path}' does not exist.");
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
                $"Animals content file '{path}' is not valid JSON.",
                exception
            );
        }

        if (document?.Animals is not { Count: > 0 } fileAnimals)
        {
            throw new InvalidOperationException(
                $"Animals content file '{path}' contains no animals."
            );
        }

        var animals = fileAnimals
            .Select((fileAnimal, animalIndex) => ToAnimal(fileAnimal, animalIndex))
            .ToList();

        var duplicateId = animals
            .GroupBy(animal => animal.AnimalId)
            .FirstOrDefault(group => group.Count() > 1)
            ?.Key;

        if (duplicateId is not null)
        {
            throw new InvalidOperationException(
                $"Animals content: the id '{duplicateId}' duplicates another animal."
            );
        }

        return new AnimalsCatalogFile(animals);
    }

    private static WorkshopAnimal ToAnimal(FileAnimal fileAnimal, int animalIndex)
    {
        if (string.IsNullOrWhiteSpace(fileAnimal.Id))
        {
            throw new InvalidOperationException(
                $"Animals content: animal {animalIndex} needs a non-empty id."
            );
        }

        var translation = fileAnimal.Translation;

        if (
            translation is null
            || string.IsNullOrWhiteSpace(translation.De)
            || string.IsNullOrWhiteSpace(translation.En)
        )
        {
            throw new InvalidOperationException(
                $"Animals content: animal {animalIndex} ('{fileAnimal.Id}') needs non-empty text in both locales."
            );
        }

        return new WorkshopAnimal(fileAnimal.Id, new LocalizedText(translation.De, translation.En));
    }

    private sealed record FileDocument(List<FileAnimal>? Animals);

    private sealed record FileAnimal(string? Id, FileText? Translation);

    private sealed record FileText(string? De, string? En);
}
