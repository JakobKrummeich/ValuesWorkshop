namespace ValuesWorkshop.Domain;

public sealed class Session
{
    public Roster Roster { get; } = new();
    public WorkshopState State { get; } = new();
    public QuizProgress Quiz { get; } = new();
    public SelectionRound Selection { get; } = new();
    public FormationRecord Formation { get; } = new();
    public PresentationWalk Presentation { get; } = new();
    public VotingRounds Voting { get; } = new();
}
