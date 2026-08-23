using System.Text.Json.Serialization;

namespace ValuesWorkshop.Application.State;

public static class FormationSubState
{
    public const string Forming = "forming";
    public const string Formed = "formed";
}

[JsonPolymorphic(TypeDiscriminatorPropertyName = "subState")]
[JsonDerivedType(typeof(ParticipantFormingView), FormationSubState.Forming)]
[JsonDerivedType(typeof(ParticipantFormedView), FormationSubState.Formed)]
public abstract record ParticipantFormationView;

public sealed record ParticipantFormingView(double Progress) : ParticipantFormationView;

public sealed record ParticipantFormedView(OwnGroupView? OwnGroup) : ParticipantFormationView;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "subState")]
[JsonDerivedType(typeof(FacilitatorFormingView), FormationSubState.Forming)]
[JsonDerivedType(typeof(FacilitatorFormedView), FormationSubState.Formed)]
public abstract record FacilitatorFormationView;

public sealed record FacilitatorFormingView(double Progress) : FacilitatorFormationView;

public sealed record FacilitatorFormedView(IReadOnlyList<FacilitatorGroupView> Groups)
    : FacilitatorFormationView;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "subState")]
[JsonDerivedType(typeof(PresenterFormingView), FormationSubState.Forming)]
[JsonDerivedType(typeof(PresenterFormedView), FormationSubState.Formed)]
public abstract record PresenterFormationView;

public sealed record PresenterFormingView(double Progress) : PresenterFormationView;

public sealed record PresenterFormedView(IReadOnlyList<PresenterGroupView> Groups)
    : PresenterFormationView;
