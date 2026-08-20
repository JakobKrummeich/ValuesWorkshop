using System.Text.Json.Serialization;

namespace ValuesWorkshop.Application.State;

public enum QuizSubState
{
    Answering = 1,
    Revealed = 2,
    LearningTextShown = 3,
}

public sealed record LocalizedTextView(string De, string En);

public sealed record ParticipantQuizView(
    int QuestionIndex,
    int QuestionCount,
    QuizSubState SubState,
    LocalizedTextView Question,
    IReadOnlyList<LocalizedTextView> Answers,
    int? OwnAnswerIndex,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] int? CorrectAnswerIndex,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        LocalizedTextView? LearningText
);

public sealed record FacilitatorQuizView(
    int QuestionIndex,
    int QuestionCount,
    QuizSubState SubState,
    LocalizedTextView Question,
    IReadOnlyList<LocalizedTextView> Answers,
    IReadOnlyList<int> AnswerTallies,
    int AnsweredCount,
    int CorrectAnswerIndex,
    LocalizedTextView LearningText
);

public sealed record PresenterQuizView(
    int QuestionIndex,
    int QuestionCount,
    QuizSubState SubState,
    LocalizedTextView Question,
    IReadOnlyList<LocalizedTextView> Answers,
    IReadOnlyList<int> AnswerTallies,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] int? CorrectAnswerIndex,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        LocalizedTextView? LearningText
);

public sealed record RosterParticipantView(Guid ParticipantId, string DisplayName);

public sealed record RosterView(
    IReadOnlyList<RosterParticipantView> Participants,
    int ParticipantCount
);

public sealed record WorkshopValueView(string ValueId, LocalizedTextView Text);

public sealed record OwnSelectionView(
    IReadOnlyList<WorkshopValueView> Values,
    IReadOnlyList<string> OwnSelectedValueIds,
    bool IsSubmitted,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        IReadOnlyDictionary<string, int>? SelectionTallies,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        IReadOnlyList<string>? TopValueIds
);

public sealed record SelectionProgressView(
    IReadOnlyList<WorkshopValueView> Values,
    int SubmittedCount,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        IReadOnlyDictionary<string, int>? SelectionTallies,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        IReadOnlyList<string>? TopValueIds
);

public sealed record GroupNameView(string AnimalId, LocalizedTextView Text);

public sealed record OwnGroupView(
    GroupNameView Name,
    IReadOnlyList<string> MemberDisplayNames,
    IReadOnlyList<WorkshopValueView> AssignedValues
);

public sealed record FacilitatorGroupView(
    GroupNameView Name,
    IReadOnlyList<RosterParticipantView> Members,
    IReadOnlyList<WorkshopValueView> AssignedValues
);

public sealed record PresenterGroupView(
    GroupNameView Name,
    IReadOnlyList<string> MemberDisplayNames,
    IReadOnlyList<WorkshopValueView> AssignedValues
);

public sealed record PresentationView(string? PresentingGroupName, string? PresentedValueId);

public sealed record PresenterPresentationView(string? PresentedValueId);

public sealed record VotingView(int RoundNumber, bool IsRoundOpen);

public sealed record PresenterVotingView(bool IsRoundOpen);

public sealed record ConclusionView(IReadOnlyList<string> WinningValueIds);
