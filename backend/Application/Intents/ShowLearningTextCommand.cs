using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Intents;

public sealed record ShowLearningTextCommand(SessionIdentity SessionIdentity, CallerSubject Caller);
