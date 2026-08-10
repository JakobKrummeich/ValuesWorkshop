using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Intents;

public sealed record RevealAnswerCommand(SessionIdentity SessionIdentity, CallerSubject Caller);
