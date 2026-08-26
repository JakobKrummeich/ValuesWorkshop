using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Intents;

public sealed record StartTiebreakRoundCommand(
    SessionIdentity SessionIdentity,
    CallerSubject Caller
);
