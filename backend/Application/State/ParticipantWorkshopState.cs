using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

public sealed record ParticipantWorkshopState(
    long Revision,
    Phase Phase,
    int ParticipantCount,
    QuizView? Quiz,
    OwnSelectionView? Selection,
    OwnGroupView? OwnGroup,
    PresentationView? Presentation,
    VotingView? Voting,
    ConclusionView? Conclusion
);
