using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Intents;

public sealed record GoToNextValueCommand(SessionIdentity SessionIdentity, CallerSubject Caller);
