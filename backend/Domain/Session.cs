namespace ValuesWorkshop.Domain;

public sealed class Session
{
    private const int MaximumNameLength = 120;

    public SessionIdentity Identity { get; }
    public FacilitatorSubject Facilitator { get; }
    public SessionName Name { get; }
    public Roster Roster { get; }
    public PhaseProgress PhaseProgress { get; }
    public QuizProgress Quiz { get; }
    public SelectionRound Selection { get; }
    public FormationRecord Formation { get; }
    public PresentationWalk Presentation { get; }
    public VotingRounds Voting { get; }
    public long Revision { get; private set; }

    public static Session Open(
        SessionIdentity identity,
        FacilitatorSubject facilitator,
        SessionName name
    )
    {
        if (string.IsNullOrWhiteSpace(facilitator.Value))
        {
            throw new InvariantViolationException("A session needs a facilitator subject.");
        }

        if (string.IsNullOrWhiteSpace(name.Value))
        {
            throw new InvariantViolationException("A session needs a name.");
        }

        var trimmedName = name.Value.Trim();

        if (trimmedName.Length > MaximumNameLength)
        {
            throw new InvariantViolationException(
                $"A session name may not exceed {MaximumNameLength} characters."
            );
        }

        return new Session(identity, facilitator, new SessionName(trimmedName));
    }

    public bool IsFacilitatedBy(FacilitatorSubject subject)
    {
        return Facilitator == subject;
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

    public void AdvancePhase(FacilitatorSubject actor, PhaseExitGuards exitGuards)
    {
        if (!IsFacilitatedBy(actor))
        {
            throw new NotAuthorizedException(
                "Only the facilitator of this session may advance the phase (I2)."
            );
        }

        exitGuards.RequireSatisfied(this);

        PhaseProgress.Advance();
    }

    public void BumpRevision()
    {
        Revision++;
    }

    internal static Session Restore(
        SessionIdentity identity,
        FacilitatorSubject facilitator,
        SessionName name,
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
            facilitator,
            name,
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

    private Session(SessionIdentity identity, FacilitatorSubject facilitator, SessionName name)
        : this(
            identity,
            facilitator,
            name,
            new Roster(),
            new PhaseProgress(),
            new QuizProgress(),
            new SelectionRound(),
            new FormationRecord(),
            new PresentationWalk(),
            new VotingRounds()
        ) { }

    private Session(
        SessionIdentity identity,
        FacilitatorSubject facilitator,
        SessionName name,
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
        Facilitator = facilitator;
        Name = name;
        Roster = roster;
        PhaseProgress = phaseProgress;
        Quiz = quiz;
        Selection = selection;
        Formation = formation;
        Presentation = presentation;
        Voting = voting;
    }
}
