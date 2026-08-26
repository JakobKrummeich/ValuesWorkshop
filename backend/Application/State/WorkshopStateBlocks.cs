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
    int? OwnAnswerIndex
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

[JsonConverter(typeof(JsonStringEnumConverter<GroupWorkStatus>))]
public enum GroupWorkStatus
{
    [JsonStringEnumMemberName("editing")]
    Editing = 1,

    [JsonStringEnumMemberName("submitted")]
    Submitted = 2,
}

public sealed record GroupActionView(Guid ActionId, string ValueId, string Text, int SortOrder);

public sealed record OwnGroupView(
    GroupNameView Name,
    IReadOnlyList<string> MemberDisplayNames,
    IReadOnlyList<WorkshopValueView> AssignedValues,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] bool? IsCallerScribe,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? ScribeName,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        GroupWorkStatus? WorkStatus,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        IReadOnlyList<GroupActionView>? Actions
);

public sealed record FacilitatorGroupView(
    GroupNameView Name,
    IReadOnlyList<RosterParticipantView> Members,
    IReadOnlyList<WorkshopValueView> AssignedValues,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        Guid? ScribeParticipantId,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        GroupWorkStatus? WorkStatus,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        IReadOnlyDictionary<string, int>? ActionCountPerValue
);

public sealed record PresenterGroupView(
    GroupNameView Name,
    IReadOnlyList<string> MemberDisplayNames,
    IReadOnlyList<WorkshopValueView> AssignedValues,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        GroupWorkStatus? WorkStatus
);

public sealed record PresentedActionView(Guid ActionId, string Text);

public sealed record PresentationView(
    string? PresentingGroupName,
    string? PresentedValueId,
    IReadOnlyList<PresentedActionView> PresentedActions
);

public sealed record PresenterPresentedActionView(string Text);

public sealed record PresenterPresentationView(
    string? PresentingGroupName,
    string? PresentedValueId,
    IReadOnlyList<PresenterPresentedActionView> PresentedActions
);

public sealed record VotingView(int RoundNumber, bool IsRoundOpen);

public sealed record PresenterVotingView(bool IsRoundOpen);

public sealed record ConclusionView(IReadOnlyList<string> WinningValueIds);
