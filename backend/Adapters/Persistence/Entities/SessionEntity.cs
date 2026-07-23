namespace ValuesWorkshop.Adapters.Persistence.Entities;

public sealed class SessionEntity
{
    public string Identity { get; set; } = "";
    public int CurrentPhase { get; set; }
    public bool IsFormed { get; set; }
    public string CreatedAt { get; set; } = "";

    public QuizStateEntity QuizState { get; set; } = null!;
    public PresentationStateEntity PresentationState { get; set; } = null!;
    public VotingStateEntity VotingState { get; set; } = null!;
    public List<ParticipantEntity> Participants { get; set; } = [];
    public List<QuizAnswerEntity> QuizAnswers { get; set; } = [];
    public List<ValueSelectionEntity> ValueSelections { get; set; } = [];
    public List<SelectionSubmissionEntity> SelectionSubmissions { get; set; } = [];
    public List<TopValueEntity> TopValues { get; set; } = [];
    public List<GroupEntity> Groups { get; set; } = [];
    public List<VoteTallyEntity> VoteTallies { get; set; } = [];
    public List<VotedParticipantEntity> VotedParticipants { get; set; } = [];
    public List<WinningValueEntity> WinningValues { get; set; } = [];
}
