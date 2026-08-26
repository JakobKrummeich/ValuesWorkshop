using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Intents;

public sealed record CorrectActionWordingCommand(
    SessionIdentity SessionIdentity,
    CallerSubject Caller,
    string? ActionId,
    string? Text
);
