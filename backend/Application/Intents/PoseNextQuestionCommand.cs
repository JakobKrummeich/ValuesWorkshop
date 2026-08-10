using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Intents;

public sealed record PoseNextQuestionCommand(SessionIdentity SessionIdentity, CallerSubject Caller);
