using System.Text.Json.Serialization;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "phase")]
[JsonDerivedType(typeof(FacilitatorJoinState), (int)Phase.Join)]
[JsonDerivedType(typeof(FacilitatorQuizState), (int)Phase.Quiz)]
[JsonDerivedType(typeof(FacilitatorValueSelectionState), (int)Phase.ValueSelection)]
[JsonDerivedType(typeof(FacilitatorSelectionResultsState), (int)Phase.SelectionResults)]
[JsonDerivedType(typeof(FacilitatorGroupFormationState), (int)Phase.GroupFormation)]
[JsonDerivedType(typeof(FacilitatorGroupWorkState), (int)Phase.GroupWork)]
[JsonDerivedType(typeof(FacilitatorValuePresentationState), (int)Phase.ValuePresentation)]
[JsonDerivedType(typeof(FacilitatorFinalVotingState), (int)Phase.FinalVoting)]
[JsonDerivedType(typeof(FacilitatorFinalPresentationState), (int)Phase.FinalPresentation)]
public abstract record FacilitatorWorkshopState(
    long Revision,
    RosterView Roster,
    IReadOnlyList<FacilitatorIntent> EnabledIntents
)
{
    [JsonIgnore]
    public abstract Phase Phase { get; }
}

public sealed record FacilitatorJoinState(
    long Revision,
    RosterView Roster,
    IReadOnlyList<FacilitatorIntent> EnabledIntents
) : FacilitatorWorkshopState(Revision, Roster, EnabledIntents)
{
    [JsonIgnore]
    public override Phase Phase => Phase.Join;
}

public sealed record FacilitatorQuizState(
    long Revision,
    RosterView Roster,
    IReadOnlyList<FacilitatorIntent> EnabledIntents,
    FacilitatorQuizView Quiz
) : FacilitatorWorkshopState(Revision, Roster, EnabledIntents)
{
    [JsonIgnore]
    public override Phase Phase => Phase.Quiz;
}

public sealed record FacilitatorValueSelectionState(
    long Revision,
    RosterView Roster,
    IReadOnlyList<FacilitatorIntent> EnabledIntents,
    SelectionProgressView Selection
) : FacilitatorWorkshopState(Revision, Roster, EnabledIntents)
{
    [JsonIgnore]
    public override Phase Phase => Phase.ValueSelection;
}

public sealed record FacilitatorSelectionResultsState(
    long Revision,
    RosterView Roster,
    IReadOnlyList<FacilitatorIntent> EnabledIntents,
    SelectionProgressView Selection
) : FacilitatorWorkshopState(Revision, Roster, EnabledIntents)
{
    [JsonIgnore]
    public override Phase Phase => Phase.SelectionResults;
}

public sealed record FacilitatorGroupFormationState(
    long Revision,
    RosterView Roster,
    IReadOnlyList<FacilitatorIntent> EnabledIntents,
    SelectionProgressView Selection,
    IReadOnlyList<FacilitatorGroupView> Groups
) : FacilitatorWorkshopState(Revision, Roster, EnabledIntents)
{
    [JsonIgnore]
    public override Phase Phase => Phase.GroupFormation;
}

public sealed record FacilitatorGroupWorkState(
    long Revision,
    RosterView Roster,
    IReadOnlyList<FacilitatorIntent> EnabledIntents,
    IReadOnlyList<FacilitatorGroupView> Groups
) : FacilitatorWorkshopState(Revision, Roster, EnabledIntents)
{
    [JsonIgnore]
    public override Phase Phase => Phase.GroupWork;
}

public sealed record FacilitatorValuePresentationState(
    long Revision,
    RosterView Roster,
    IReadOnlyList<FacilitatorIntent> EnabledIntents,
    IReadOnlyList<FacilitatorGroupView> Groups,
    PresentationView Presentation
) : FacilitatorWorkshopState(Revision, Roster, EnabledIntents)
{
    [JsonIgnore]
    public override Phase Phase => Phase.ValuePresentation;
}

public sealed record FacilitatorFinalVotingState(
    long Revision,
    RosterView Roster,
    IReadOnlyList<FacilitatorIntent> EnabledIntents,
    VotingView Voting
) : FacilitatorWorkshopState(Revision, Roster, EnabledIntents)
{
    [JsonIgnore]
    public override Phase Phase => Phase.FinalVoting;
}

public sealed record FacilitatorFinalPresentationState(
    long Revision,
    RosterView Roster,
    IReadOnlyList<FacilitatorIntent> EnabledIntents,
    ConclusionView Conclusion
) : FacilitatorWorkshopState(Revision, Roster, EnabledIntents)
{
    [JsonIgnore]
    public override Phase Phase => Phase.FinalPresentation;
}
