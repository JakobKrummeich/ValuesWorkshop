using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Intents;

public sealed record CloseVotingCommand(SessionIdentity SessionIdentity, CallerSubject Caller);
