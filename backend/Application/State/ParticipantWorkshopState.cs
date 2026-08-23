using System.Text.Json.Serialization;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "phase")]
[JsonDerivedType(typeof(ParticipantJoinState), (int)Phase.Join)]
[JsonDerivedType(typeof(ParticipantQuizState), (int)Phase.Quiz)]
[JsonDerivedType(typeof(ParticipantValueSelectionState), (int)Phase.ValueSelection)]
[JsonDerivedType(typeof(ParticipantSelectionResultsState), (int)Phase.SelectionResults)]
[JsonDerivedType(typeof(ParticipantGroupFormationState), (int)Phase.GroupFormation)]
[JsonDerivedType(typeof(ParticipantGroupWorkState), (int)Phase.GroupWork)]
[JsonDerivedType(typeof(ParticipantValuePresentationState), (int)Phase.ValuePresentation)]
[JsonDerivedType(typeof(ParticipantFinalVotingState), (int)Phase.FinalVoting)]
[JsonDerivedType(typeof(ParticipantFinalPresentationState), (int)Phase.FinalPresentation)]
public abstract record ParticipantWorkshopState(long Revision, int ParticipantCount)
{
    [JsonIgnore]
    public abstract Phase Phase { get; }
}

public sealed record ParticipantJoinState(
    long Revision,
    int ParticipantCount,
    string OwnDisplayName
) : ParticipantWorkshopState(Revision, ParticipantCount)
{
    [JsonIgnore]
    public override Phase Phase => Phase.Join;
}

public sealed record ParticipantQuizState(
    long Revision,
    int ParticipantCount,
    ParticipantQuizView Quiz
) : ParticipantWorkshopState(Revision, ParticipantCount)
{
    [JsonIgnore]
    public override Phase Phase => Phase.Quiz;
}

public sealed record ParticipantValueSelectionState(
    long Revision,
    int ParticipantCount,
    OwnSelectionView Selection
) : ParticipantWorkshopState(Revision, ParticipantCount)
{
    [JsonIgnore]
    public override Phase Phase => Phase.ValueSelection;
}

public sealed record ParticipantSelectionResultsState(
    long Revision,
    int ParticipantCount,
    OwnSelectionView Selection
) : ParticipantWorkshopState(Revision, ParticipantCount)
{
    [JsonIgnore]
    public override Phase Phase => Phase.SelectionResults;
}

public sealed record ParticipantGroupFormationState(
    long Revision,
    int ParticipantCount,
    ParticipantFormationView Formation
) : ParticipantWorkshopState(Revision, ParticipantCount)
{
    [JsonIgnore]
    public override Phase Phase => Phase.GroupFormation;
}

public sealed record ParticipantGroupWorkState(
    long Revision,
    int ParticipantCount,
    OwnGroupView? OwnGroup
) : ParticipantWorkshopState(Revision, ParticipantCount)
{
    [JsonIgnore]
    public override Phase Phase => Phase.GroupWork;
}

public sealed record ParticipantValuePresentationState(
    long Revision,
    int ParticipantCount,
    OwnGroupView? OwnGroup,
    PresentationView Presentation
) : ParticipantWorkshopState(Revision, ParticipantCount)
{
    [JsonIgnore]
    public override Phase Phase => Phase.ValuePresentation;
}

public sealed record ParticipantFinalVotingState(
    long Revision,
    int ParticipantCount,
    VotingView Voting
) : ParticipantWorkshopState(Revision, ParticipantCount)
{
    [JsonIgnore]
    public override Phase Phase => Phase.FinalVoting;
}

public sealed record ParticipantFinalPresentationState(
    long Revision,
    int ParticipantCount,
    ConclusionView Conclusion
) : ParticipantWorkshopState(Revision, ParticipantCount)
{
    [JsonIgnore]
    public override Phase Phase => Phase.FinalPresentation;
}
