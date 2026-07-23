namespace ValuesWorkshop.Domain;

public sealed class Session
{
    public SessionIdentity Identity { get; }
    public Roster Roster { get; }
    public WorkshopState State { get; }
    public QuizProgress Quiz { get; }
    public SelectionRound Selection { get; }
    public FormationRecord Formation { get; }
    public PresentationWalk Presentation { get; }
    public VotingRounds Voting { get; }

    public Session(SessionIdentity identity)
    {
        Identity = identity;
        Roster = new Roster();
        State = new WorkshopState();
        Quiz = new QuizProgress();
        Selection = new SelectionRound();
        Formation = new FormationRecord();
        Presentation = new PresentationWalk();
        Voting = new VotingRounds();
    }

    internal static Session Restore(
        SessionIdentity identity,
        Roster roster,
        WorkshopState state,
        QuizProgress quiz,
        SelectionRound selection,
        FormationRecord formation,
        PresentationWalk presentation,
        VotingRounds voting
    )
    {
        return new Session(
            identity,
            roster,
            state,
            quiz,
            selection,
            formation,
            presentation,
            voting
        );
    }

    private Session(
        SessionIdentity identity,
        Roster roster,
        WorkshopState state,
        QuizProgress quiz,
        SelectionRound selection,
        FormationRecord formation,
        PresentationWalk presentation,
        VotingRounds voting
    )
    {
        Identity = identity;
        Roster = roster;
        State = state;
        Quiz = quiz;
        Selection = selection;
        Formation = formation;
        Presentation = presentation;
        Voting = voting;
    }
}
