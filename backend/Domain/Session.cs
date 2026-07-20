namespace ValuesWorkshop.Domain;

/// <summary>
/// Aggregate root: the workshop run. Guards the boundary (phase + actor)
/// and routes each command to exactly one building block — nothing else.
/// Building-block rules live in the blocks (see design/domain-model.md,
/// implementation guardrail: a rule implemented here is a god-class defect).
/// </summary>
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
