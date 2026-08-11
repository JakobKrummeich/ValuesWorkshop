namespace ValuesWorkshop.Host.Tests;

public sealed class ValuesCatalogFileTests : IDisposable
{
    private readonly List<string> temporaryFiles = [];

    [Fact]
    public void The_shipped_values_content_has_fifty_values()
    {
        var catalog = ShippedCatalog();

        catalog.Values.Count.ShouldBe(50);
    }

    [Fact]
    public void Every_shipped_value_id_is_unique()
    {
        var catalog = ShippedCatalog();

        catalog.Values.Select(value => value.ValueId).ShouldBeUnique();
    }

    [Fact]
    public void Every_shipped_value_is_present_in_both_locales()
    {
        var catalog = ShippedCatalog();

        foreach (var value in catalog.Values)
        {
            value.Text.German.ShouldNotBeNullOrWhiteSpace();
            value.Text.English.ShouldNotBeNullOrWhiteSpace();
        }
    }

    [Fact]
    public void A_missing_file_refuses_to_load()
    {
        var exception = Should.Throw<InvalidOperationException>(() =>
            ValuesCatalogFile.LoadFrom(Path.Combine(Path.GetTempPath(), "no-such-values.json"))
        );

        exception.Message.ShouldContain("does not exist");
    }

    [Fact]
    public void A_file_that_is_not_json_refuses_to_load()
    {
        var path = TemporaryFile("this is not json");

        var exception = Should.Throw<InvalidOperationException>(() =>
            ValuesCatalogFile.LoadFrom(path)
        );

        exception.Message.ShouldContain("not valid JSON");
    }

    [Fact]
    public void A_file_without_values_refuses_to_load()
    {
        var path = TemporaryFile("""{ "values": [] }""");

        var exception = Should.Throw<InvalidOperationException>(() =>
            ValuesCatalogFile.LoadFrom(path)
        );

        exception.Message.ShouldContain("no values");
    }

    [Fact]
    public void A_value_without_an_id_refuses_to_load()
    {
        var path = TemporaryFile(ValuesDocument(secondId: " "));

        var exception = Should.Throw<InvalidOperationException>(() =>
            ValuesCatalogFile.LoadFrom(path)
        );

        exception.Message.ShouldContain("non-empty id");
    }

    [Fact]
    public void A_duplicate_value_id_refuses_to_load()
    {
        var path = TemporaryFile(ValuesDocument(secondId: "mut"));

        var exception = Should.Throw<InvalidOperationException>(() =>
            ValuesCatalogFile.LoadFrom(path)
        );

        exception.Message.ShouldContain("duplicates");
    }

    [Fact]
    public void A_value_with_an_empty_locale_refuses_to_load()
    {
        var path = TemporaryFile(ValuesDocument(secondEnglishText: " "));

        var exception = Should.Throw<InvalidOperationException>(() =>
            ValuesCatalogFile.LoadFrom(path)
        );

        exception.Message.ShouldContain("both locales");
    }

    [Fact]
    public void A_value_without_a_translation_refuses_to_load()
    {
        var path = TemporaryFile(
            """
            {
              "values": [
                { "id": "mut" }
              ]
            }
            """
        );

        var exception = Should.Throw<InvalidOperationException>(() =>
            ValuesCatalogFile.LoadFrom(path)
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

    private static ValuesCatalogFile ShippedCatalog()
    {
        return ValuesCatalogFile.LoadFrom(Path.Combine("config", "values.json"));
    }

    private static string ValuesDocument(
        string secondId = "respekt",
        string secondEnglishText = "Respect"
    )
    {
        return $$"""
            {
              "values": [
                { "id": "mut", "translation": { "de": "Mut", "en": "Courage" } },
                { "id": "{{secondId}}", "translation": { "de": "Respekt", "en": "{{secondEnglishText}}" } }
              ]
            }
            """;
    }

    private string TemporaryFile(string content)
    {
        var path = Path.Combine(Path.GetTempPath(), $"values-test-{Guid.NewGuid()}.json");
        File.WriteAllText(path, content);
        temporaryFiles.Add(path);

        return path;
    }
}
