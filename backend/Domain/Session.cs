namespace ValuesWorkshop.Domain;

public sealed class Session
{
    public SessionIdentity Identity { get; }
    public Roster Roster { get; }
    public PhaseProgress PhaseProgress { get; }
    public QuizProgress Quiz { get; }
    public SelectionRound Selection { get; }
    public FormationRecord Formation { get; }
    public PresentationWalk Presentation { get; }
    public VotingRounds Voting { get; }
    public long Revision { get; private set; }

    public Session(SessionIdentity identity)
    {
        Identity = identity;
        Roster = new Roster();
        PhaseProgress = new PhaseProgress();
        Quiz = new QuizProgress();
        Selection = new SelectionRound();
        Formation = new FormationRecord();
        Presentation = new PresentationWalk();
        Voting = new VotingRounds();
    }

    public bool Join(ParticipantId participantId, IRandomness randomness)
    {
        if (Roster.Contains(participantId))
        {
            return false;
        }

        Roster.Add(participantId);

        if (Formation.IsFormed)
        {
            Formation.PlaceIntoSmallestGroup(participantId, randomness);
        }

        return true;
    }

    public void AdvancePhase()
    {
        PhaseProgress.Advance();
    }

    public void BumpRevision()
    {
        Revision++;
    }

    internal static Session Restore(
        SessionIdentity identity,
        Roster roster,
        PhaseProgress phaseProgress,
        QuizProgress quiz,
        SelectionRound selection,
        FormationRecord formation,
        PresentationWalk presentation,
        VotingRounds voting,
        long revision
    )
    {
        return new Session(
            identity,
            roster,
            phaseProgress,
            quiz,
            selection,
            formation,
            presentation,
            voting
        )
        {
            Revision = revision,
        };
    }

    private Session(
        SessionIdentity identity,
        Roster roster,
        PhaseProgress phaseProgress,
        QuizProgress quiz,
        SelectionRound selection,
        FormationRecord formation,
        PresentationWalk presentation,
        VotingRounds voting
    )
    {
        Identity = identity;
        Roster = roster;
        PhaseProgress = phaseProgress;
        Quiz = quiz;
        Selection = selection;
        Formation = formation;
        Presentation = presentation;
        Voting = voting;
    }
}
