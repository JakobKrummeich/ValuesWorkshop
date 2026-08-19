namespace ValuesWorkshop.Host.Tests;

public sealed class AnimalsCatalogFileTests : IDisposable
{
    private readonly List<string> temporaryFiles = [];

    [Fact]
    public void The_shipped_animals_content_has_eight_animals()
    {
        var catalog = ShippedCatalog();

        catalog.Animals.Count.ShouldBe(8);
    }

    [Fact]
    public void Every_shipped_animal_id_is_unique()
    {
        var catalog = ShippedCatalog();

        catalog.Animals.Select(animal => animal.AnimalId).ShouldBeUnique();
    }

    [Fact]
    public void Every_shipped_animal_is_present_in_both_locales()
    {
        var catalog = ShippedCatalog();

        foreach (var animal in catalog.Animals)
        {
            animal.Text.German.ShouldNotBeNullOrWhiteSpace();
            animal.Text.English.ShouldNotBeNullOrWhiteSpace();
        }
    }

    [Fact]
    public void The_animal_names_follow_the_catalog_order()
    {
        var catalog = ShippedCatalog();

        catalog.Names.ShouldBe(catalog.Animals.Select(animal => animal.AnimalId).ToList());
        catalog.Names.First().ShouldBe("otter");
    }

    [Fact]
    public void A_missing_file_refuses_to_load()
    {
        var exception = Should.Throw<InvalidOperationException>(() =>
            AnimalsCatalogFile.LoadFrom(Path.Combine(Path.GetTempPath(), "no-such-animals.json"))
        );

        exception.Message.ShouldContain("does not exist");
    }

    [Fact]
    public void A_file_that_is_not_json_refuses_to_load()
    {
        var path = TemporaryFile("this is not json");

        var exception = Should.Throw<InvalidOperationException>(() =>
            AnimalsCatalogFile.LoadFrom(path)
        );

        exception.Message.ShouldContain("not valid JSON");
    }

    [Fact]
    public void A_file_without_animals_refuses_to_load()
    {
        var path = TemporaryFile("""{ "animals": [] }""");

        var exception = Should.Throw<InvalidOperationException>(() =>
            AnimalsCatalogFile.LoadFrom(path)
        );

        exception.Message.ShouldContain("no animals");
    }

    [Fact]
    public void An_animal_without_an_id_refuses_to_load()
    {
        var path = TemporaryFile(AnimalsDocument(secondId: " "));

        var exception = Should.Throw<InvalidOperationException>(() =>
            AnimalsCatalogFile.LoadFrom(path)
        );

        exception.Message.ShouldContain("non-empty id");
    }

    [Fact]
    public void A_duplicate_animal_id_refuses_to_load()
    {
        var path = TemporaryFile(AnimalsDocument(secondId: "otter"));

        var exception = Should.Throw<InvalidOperationException>(() =>
            AnimalsCatalogFile.LoadFrom(path)
        );

        exception.Message.ShouldContain("duplicates");
    }

    [Fact]
    public void An_animal_with_an_empty_locale_refuses_to_load()
    {
        var path = TemporaryFile(AnimalsDocument(secondEnglishText: " "));

        var exception = Should.Throw<InvalidOperationException>(() =>
            AnimalsCatalogFile.LoadFrom(path)
        );

        exception.Message.ShouldContain("both locales");
    }

    [Fact]
    public void An_animal_without_a_translation_refuses_to_load()
    {
        var path = TemporaryFile(
            """
            {
              "animals": [
                { "id": "otter" }
              ]
            }
            """
        );

        var exception = Should.Throw<InvalidOperationException>(() =>
            AnimalsCatalogFile.LoadFrom(path)
        );

        exception.Message.ShouldContain("both locales");
    }

    public void Dispose()
    {
        foreach (var path in temporaryFiles)
        {
            File.Delete(path);
        }
    }

    private static AnimalsCatalogFile ShippedCatalog()
    {
        return AnimalsCatalogFile.LoadFrom(Path.Combine("config", "animals.json"));
    }

    private static string AnimalsDocument(
        string secondId = "fuchs",
        string secondEnglishText = "Fox"
    )
    {
        return $$"""
            {
              "animals": [
                { "id": "otter", "translation": { "de": "Otter", "en": "Otter" } },
                { "id": "{{secondId}}", "translation": { "de": "Fuchs", "en": "{{secondEnglishText}}" } }
              ]
            }
            """;
    }

    private string TemporaryFile(string content)
    {
        var path = Path.Combine(Path.GetTempPath(), $"animals-test-{Guid.NewGuid()}.json");
        File.WriteAllText(path, content);
        temporaryFiles.Add(path);

        return path;
    }
}
