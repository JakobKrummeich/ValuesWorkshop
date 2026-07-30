using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

public sealed record FacilitatorWorkshopState(
    long Revision,
    Phase Phase,
    RosterView Roster,
    QuizView? Quiz,
    SelectionProgressView? Selection,
    IReadOnlyList<FacilitatorGroupView>? Groups,
    PresentationView? Presentation,
    VotingView? Voting,
    ConclusionView? Conclusion
);
