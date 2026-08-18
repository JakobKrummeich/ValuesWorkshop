using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Ports.Driven;

public sealed record GroupFormationRequest(
    IReadOnlyList<ParticipantSelection> Participants,
    IReadOnlyList<ValueId> TopValues
);

public sealed record ParticipantSelection(
    ParticipantId ParticipantId,
    IReadOnlyList<ValueId> SelectedValues
);

public sealed record GroupFormationResult(IReadOnlyList<FormedGroup> Groups);

public sealed record FormedGroup(
    IReadOnlyList<ParticipantId> Members,
    IReadOnlyList<ValueId> AssignedValues
);
