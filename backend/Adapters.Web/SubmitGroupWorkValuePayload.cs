namespace ValuesWorkshop.Adapters.Web;

public sealed record SubmitGroupWorkActionPayload(string? ActionId, string? Text);

public sealed record SubmitGroupWorkValuePayload(
    string? ValueId,
    SubmitGroupWorkActionPayload[]? Actions
);
