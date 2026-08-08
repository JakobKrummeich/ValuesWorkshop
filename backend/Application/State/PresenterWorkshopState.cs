using System.Text.Json.Serialization;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "phase")]
[JsonDerivedType(typeof(PresenterJoinState), (int)Phase.Join)]
[JsonDerivedType(typeof(PresenterQuizState), (int)Phase.Quiz)]
[JsonDerivedType(typeof(PresenterValueSelectionState), (int)Phase.ValueSelection)]
[JsonDerivedType(typeof(PresenterSelectionResultsState), (int)Phase.SelectionResults)]
[JsonDerivedType(typeof(PresenterGroupFormationState), (int)Phase.GroupFormation)]
[JsonDerivedType(typeof(PresenterGroupWorkState), (int)Phase.GroupWork)]
[JsonDerivedType(typeof(PresenterValuePresentationState), (int)Phase.ValuePresentation)]
[JsonDerivedType(typeof(PresenterFinalVotingState), (int)Phase.FinalVoting)]
[JsonDerivedType(typeof(PresenterFinalPresentationState), (int)Phase.FinalPresentation)]
public abstract record PresenterWorkshopState(long Revision, int ParticipantCount)
{
    [JsonIgnore]
    public abstract Phase Phase { get; }
}

public sealed record PresenterJoinState(
    long Revision,
    int ParticipantCount,
    IReadOnlyList<string> ParticipantDisplayNames
) : PresenterWorkshopState(Revision, ParticipantCount)
{
    [JsonIgnore]
    public override Phase Phase => Phase.Join;
}

public sealed record PresenterQuizState(long Revision, int ParticipantCount, QuizView Quiz)
    : PresenterWorkshopState(Revision, ParticipantCount)
{
    [JsonIgnore]
    public override Phase Phase => Phase.Quiz;
}

public sealed record PresenterValueSelectionState(
    long Revision,
    int ParticipantCount,
    SelectionProgressView Selection
) : PresenterWorkshopState(Revision, ParticipantCount)
{
    [JsonIgnore]
    public override Phase Phase => Phase.ValueSelection;
}

public sealed record PresenterSelectionResultsState(
    long Revision,
    int ParticipantCount,
    SelectionProgressView Selection
) : PresenterWorkshopState(Revision, ParticipantCount)
{
    [JsonIgnore]
    public override Phase Phase => Phase.SelectionResults;
}

public sealed record PresenterGroupFormationState(
    long Revision,
    int ParticipantCount,
    SelectionProgressView Selection,
    IReadOnlyList<PresenterGroupView> Groups
) : PresenterWorkshopState(Revision, ParticipantCount)
{
    [JsonIgnore]
    public override Phase Phase => Phase.GroupFormation;
}

public sealed record PresenterGroupWorkState(
    long Revision,
    int ParticipantCount,
    IReadOnlyList<PresenterGroupView> Groups
) : PresenterWorkshopState(Revision, ParticipantCount)
{
    [JsonIgnore]
    public override Phase Phase => Phase.GroupWork;
}

public sealed record PresenterValuePresentationState(
    long Revision,
    int ParticipantCount,
    IReadOnlyList<PresenterGroupView> Groups,
    PresenterPresentationView Presentation
) : PresenterWorkshopState(Revision, ParticipantCount)
{
    [JsonIgnore]
    public override Phase Phase => Phase.ValuePresentation;
}

public sealed record PresenterFinalVotingState(
    long Revision,
    int ParticipantCount,
    PresenterVotingView Voting
) : PresenterWorkshopState(Revision, ParticipantCount)
{
    [JsonIgnore]
    public override Phase Phase => Phase.FinalVoting;
}

public sealed record PresenterFinalPresentationState(
    long Revision,
    int ParticipantCount,
    ConclusionView Conclusion
) : PresenterWorkshopState(Revision, ParticipantCount)
{
    [JsonIgnore]
    public override Phase Phase => Phase.FinalPresentation;
}
