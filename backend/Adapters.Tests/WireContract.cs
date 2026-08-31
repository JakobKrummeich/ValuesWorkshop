using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Protocol;
using Microsoft.Extensions.Options;

namespace ValuesWorkshop.Adapters.Tests;

// WHY: the checked-in contract/ corpus is the machine-checked shadow of
// design/protocol.md that the frontend suite reads. Producing it here — through
// the very JsonHubProtocol the hubs push state with — keeps it an account of
// what actually goes over the wire rather than a hand-maintained guess.
// Plan: docs/architecture/reviews/2026-08-30-wire-contract-fitness-function.md.
internal static class WireContract
{
    private const string RegenerateSwitch = "CONTRACT_WRITE";

    internal static readonly JsonSerializerOptions Json = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true,
    };

    internal static void ShouldMatchCheckedInFile(string json, params string[] pathSegments)
    {
        var contractFile = ContractFile(pathSegments);

        if (Environment.GetEnvironmentVariable(RegenerateSwitch) == "1")
        {
            Directory.CreateDirectory(Path.GetDirectoryName(contractFile)!);
            File.WriteAllText(contractFile, json + "\n");
        }

        File.Exists(contractFile)
            .ShouldBeTrue($"{Path.GetFileName(contractFile)} is missing. {RegenerateHint}");
        Normalized(File.ReadAllText(contractFile))
            .ShouldBe(
                Normalized(json),
                $"contract/{string.Join('/', pathSegments)} is stale. {RegenerateHint}"
            );
    }

    internal static IReadOnlyList<string> CheckedInFilesIn(params string[] pathSegments)
    {
        var directory = ContractFile(pathSegments);

        return
        [
            .. Directory
                .EnumerateFiles(directory, "*.json", SearchOption.AllDirectories)
                .Select(file => Path.GetRelativePath(directory, file).Replace('\\', '/'))
                .Order(StringComparer.Ordinal),
        ];
    }

    // WHY: serializing through the real protocol — not a bare JsonSerializer — is
    // what makes the corpus trustworthy: enum converters, naming policy and null
    // handling are the ones SignalR applies when it pushes to a browser.
    internal static JsonElement WireFormOf(object value)
    {
        var protocol = new JsonHubProtocol(Options.Create(new JsonHubProtocolOptions()));
        var message = new InvocationMessage("ReceiveWorkshopState", [value]);
        var json = Encoding.UTF8.GetString(protocol.GetMessageBytes(message).ToArray());

        using var document = JsonDocument.Parse(json.TrimEnd('\u001e'));
        return document.RootElement.GetProperty("arguments")[0].Clone();
    }

    private const string RegenerateHint =
        "Regenerate the corpus with: CONTRACT_WRITE=1 dotnet test backend/ValuesWorkshop.Tests.slnf";

    private static string ContractFile(params string[] pathSegments)
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (
            directory is not null && !Directory.Exists(Path.Combine(directory.FullName, "contract"))
        )
        {
            directory = directory.Parent;
        }

        directory.ShouldNotBeNull($"No contract directory above {AppContext.BaseDirectory}.");
        return Path.Combine([directory.FullName, "contract", .. pathSegments]);
    }

    // WHY: compare content, not platform line endings — Utf8JsonWriter indents with
    // Environment.NewLine, so a byte comparison would fail on Windows checkouts only.
    private static string Normalized(string json)
    {
        return json.ReplaceLineEndings("\n").TrimEnd();
    }
}
