using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

public sealed record PresenterWorkshopState(
    long Revision,
    Phase Phase,
    int ParticipantCount,
    QuizView? Quiz,
    SelectionProgressView? Selection,
    IReadOnlyList<PresenterGroupView>? Groups,
    PresenterPresentationView? Presentation,
    PresenterVotingView? Voting,
    ConclusionView? Conclusion
);
