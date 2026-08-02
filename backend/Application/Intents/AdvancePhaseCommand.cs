using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Intents;

public sealed record AdvancePhaseCommand(SessionIdentity SessionIdentity, FacilitatorSubject Actor);
