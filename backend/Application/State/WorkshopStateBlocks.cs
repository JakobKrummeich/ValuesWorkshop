namespace ValuesWorkshop.Application.State;

public enum QuizSubState
{
    Answering = 1,
    Revealed = 2,
    LearningTextShown = 3,
}

public enum GroupWorkStatus
{
    Editing = 1,
    Submitted = 2,
}

public sealed record QuizView(int? QuestionIndex, QuizSubState SubState);

public sealed record RosterParticipantView(Guid ParticipantId, string DisplayName);

public sealed record RosterView(
    IReadOnlyList<RosterParticipantView> Participants,
    int ParticipantCount
);

public sealed record OwnSelectionView(bool IsOwnSubmitted, IReadOnlyList<string> TopValueIds);

public sealed record SelectionProgressView(int SubmittedCount, IReadOnlyList<string> TopValueIds);

public sealed record OwnGroupView(
    string Name,
    int MemberCount,
    IReadOnlyList<string> AssignedValueIds,
    bool IsCallerScribe,
    GroupWorkStatus WorkStatus
);

public sealed record FacilitatorGroupView(
    string Name,
    IReadOnlyList<Guid> MemberParticipantIds,
    IReadOnlyList<string> AssignedValueIds,
    Guid? ScribeParticipantId,
    GroupWorkStatus WorkStatus
);

public sealed record PresenterGroupView(
    string Name,
    int MemberCount,
    IReadOnlyList<string> AssignedValueIds,
    GroupWorkStatus WorkStatus
);

public sealed record PresentationView(string? PresentingGroupName, string? PresentedValueId);

public sealed record PresenterPresentationView(string? PresentedValueId);

public sealed record VotingView(int RoundNumber, bool IsRoundOpen);

public sealed record PresenterVotingView(bool IsRoundOpen);

public sealed record ConclusionView(IReadOnlyList<string> WinningValueIds);
