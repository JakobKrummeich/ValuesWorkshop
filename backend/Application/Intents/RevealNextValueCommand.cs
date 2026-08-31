using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Intents;

public sealed record RevealNextValueCommand(SessionIdentity SessionIdentity, CallerSubject Caller);
