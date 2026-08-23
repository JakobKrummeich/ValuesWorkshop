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

    public bool IsFormingGroups =>
        PhaseProgress.CurrentPhase == Phase.GroupFormation && !Formation.IsFormed;

    public bool IsFacilitatedBy(CallerSubject caller)
    {
        return string.Equals(Facilitator.Value, caller.Value, StringComparison.Ordinal);
    }

    public bool Join(Participant participant, IRandomness randomness)
    {
        if (Roster.Contains(participant.Id))
        {
            return false;
        }

        Roster.Add(participant);

        if (Formation.IsFormed)
        {
            Formation.PlaceIntoSmallestGroup(participant.Id, randomness);
        }

        return true;
    }

    public void AdvancePhase()
    {
        PhaseExitGuards.RequireSatisfiedBy(this);

        PhaseProgress.Advance();

        if (PhaseProgress.CurrentPhase == Phase.Quiz)
        {
            Quiz.PoseFirstQuestion();
        }

        if (PhaseProgress.CurrentPhase == Phase.SelectionResults)
        {
            Selection.DetermineTopValues();
        }
    }

    public void FormGroups(
        GroupFormationResult formationResult,
        IReadOnlyList<string> groupNames,
        IRandomness randomness
    )
    {
        if (Formation.IsFormed)
        {
            return;
        }

        Formation.Form(formationResult, groupNames);

        foreach (var participant in Roster.Participants)
        {
            if (!Formation.IsGrouped(participant.Id))
            {
                Formation.PlaceIntoSmallestGroup(participant.Id, randomness);
            }
        }
    }

    public void RevealAnswer()
    {
        RequireQuizPhase();

        Quiz.RevealAnswer();
    }

    public void ShowLearningText()
    {
        RequireQuizPhase();

        Quiz.ShowLearningText();
    }

    public void ChooseQuizAnswer(ParticipantId participantId, int questionIndex, int answerIndex)
    {
        if (!Roster.Contains(participantId))
        {
            throw new NotAuthorizedException(
                "Only a joined participant may answer a quiz question."
            );
        }

        RequireQuizPhase();

        Quiz.ChooseAnswer(participantId, questionIndex, answerIndex);
    }

    public void SubmitValueSelection(
        ParticipantId participantId,
        IReadOnlyList<ValueId> valueIds,
        IReadOnlySet<ValueId> validValueIds
    )
    {
        if (!Roster.Contains(participantId))
        {
            throw new NotAuthorizedException(
                "Only a joined participant may submit a value selection."
            );
        }

        RequireValueSelectionPhase();

        Selection.Submit(participantId, valueIds, validValueIds);
    }

    public void PoseNextQuestion()
    {
        RequireQuizPhase();

        Quiz.PoseNextQuestion();
    }

    private void RequireQuizPhase()
    {
        if (PhaseProgress.CurrentPhase != Phase.Quiz)
        {
            throw new WrongPhaseException("The quiz commands exist only during the quiz phase.");
        }
    }

    private void RequireValueSelectionPhase()
    {
        if (PhaseProgress.CurrentPhase != Phase.ValueSelection)
        {
            throw new WrongPhaseException(
                "The value-selection commands exist only during the value-selection phase."
            );
        }
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
