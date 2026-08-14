using ValuesWorkshop.Adapters.Persistence.Entities;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Persistence;

internal static class DomainEntityMapper
{
    internal static SessionEntity ToEntity(Session session)
    {
        var identityString = session.Identity.Value.ToString();

        return new SessionEntity
        {
            Identity = identityString,
            FacilitatorSubject = session.Facilitator.Value,
            Name = session.Name.Value,
            CurrentPhase = (int)session.PhaseProgress.CurrentPhase,
            Revision = session.Revision,
            IsFormed = session.Formation.IsFormed,
            CreatedAt = DateTime.UtcNow.ToString("o"),
            QuizState = new QuizStateEntity
            {
                SessionIdentity = identityString,
                CurrentQuestionIndex = session.Quiz.CurrentQuestionIndex,
                IsRevealed = session.Quiz.IsRevealed,
                IsLearningTextShown = session.Quiz.IsLearningTextShown,
            },
            QuizAnswers = session
                .Quiz.CastAnswers.Select(cast => new QuizAnswerEntity
                {
                    SessionIdentity = identityString,
                    QuestionIndex = cast.QuestionIndex,
                    ParticipantId = cast.ParticipantId.Value.ToString(),
                    AnswerIndex = cast.AnswerIndex,
                })
                .ToList(),
            PresentationState = new PresentationStateEntity
            {
                SessionIdentity = identityString,
                PresentingGroupName = session.Presentation.PresentingGroup,
                PresentedValueId = session.Presentation.PresentedValue?.Value,
                ShownValueCount = session.Presentation.ShownValueCount,
            },
            VotingState = new VotingStateEntity
            {
                SessionIdentity = identityString,
                RoundOpen = session.Voting.RoundOpen,
                RoundNumber = session.Voting.RoundNumber,
            },
            Participants = session
                .Roster.Participants.Select(
                    (participant, index) =>
                        new ParticipantEntity
                        {
                            Id = participant.Id.Value.ToString(),
                            SessionIdentity = identityString,
                            DisplayName = participant.Name.Value,
                            JoinOrder = index + 1,
                        }
                )
                .ToList(),
            ValueSelections = session
                .Selection.SelectedValues.Select(selected => new ValueSelectionEntity
                {
                    SessionIdentity = identityString,
                    ParticipantId = selected.ParticipantId.Value.ToString(),
                    ValueId = selected.ValueId.Value,
                })
                .ToList(),
            TopValues = session
                .Selection.TopValues.Select(valueId => new TopValueEntity
                {
                    SessionIdentity = identityString,
                    ValueId = valueId.Value,
                })
                .ToList(),
            Groups = session
                .Formation.Groups.Select(group => ToGroupEntity(identityString, group))
                .ToList(),
            WinningValues = session
                .Voting.WinningValues.Select(
                    (valueId, index) =>
                        new WinningValueEntity
                        {
                            SessionIdentity = identityString,
                            ValueId = valueId.Value,
                            Rank = index + 1,
                        }
                )
                .ToList(),
        };
    }

    internal static Session ToDomain(SessionEntity entity)
    {
        var roster = Roster.Restore(
            entity.Participants.OrderBy(participant => participant.JoinOrder).Select(ToParticipant)
        );

        var state = PhaseProgress.Restore((Phase)entity.CurrentPhase);

        var quiz = QuizProgress.Restore(
            entity.QuizState.CurrentQuestionIndex,
            entity.QuizState.IsRevealed,
            entity.QuizState.IsLearningTextShown,
            entity.QuizAnswers.Select(answer => new CastAnswer(
                answer.QuestionIndex,
                new ParticipantId(Guid.Parse(answer.ParticipantId)),
                answer.AnswerIndex
            ))
        );

        var selection = SelectionRound.Restore(
            entity.ValueSelections.Select(selected => new SelectedValue(
                new ParticipantId(Guid.Parse(selected.ParticipantId)),
                new ValueId(selected.ValueId)
            )),
            entity.TopValues.Select(topValue => new ValueId(topValue.ValueId))
        );

        var groups = entity
            .Groups.Select(groupEntity =>
                Group.Restore(
                    groupEntity.Name,
                    groupEntity
                        .Members.Select(member => new ParticipantId(
                            Guid.Parse(member.ParticipantId)
                        ))
                        .ToList(),
                    groupEntity
                        .AssignedValues.Select(assignedValue => new ValueId(assignedValue.ValueId))
                        .ToList(),
                    groupEntity.ScribeParticipantId is not null
                        ? new ParticipantId(Guid.Parse(groupEntity.ScribeParticipantId))
                        : null,
                    groupEntity.IsSubmitted
                )
            )
            .ToList();

        var formation = FormationRecord.Restore(entity.IsFormed, groups);

        var presentation = PresentationWalk.Restore(
            entity.PresentationState.PresentingGroupName,
            entity.PresentationState.PresentedValueId is not null
                ? new ValueId(entity.PresentationState.PresentedValueId)
                : null,
            entity.PresentationState.ShownValueCount
        );

        var voting = VotingRounds.Restore(
            entity.VotingState.RoundOpen,
            entity.VotingState.RoundNumber,
            entity
                .WinningValues.OrderBy(winner => winner.Rank)
                .Select(winner => new ValueId(winner.ValueId))
        );

        var identity = new SessionIdentity(Guid.Parse(entity.Identity));

        return Session.Restore(
            identity,
            new FacilitatorSubject(entity.FacilitatorSubject),
            new SessionName(entity.Name),
            roster,
            state,
            quiz,
            selection,
            formation,
            presentation,
            voting,
            entity.Revision
        );
    }

    private static Participant ToParticipant(ParticipantEntity entity)
    {
        var participantId = new ParticipantId(Guid.Parse(entity.Id));

        return new Participant(
            participantId,
            ParticipantName.Of(entity.DisplayName, participantId)
        );
    }

    private static GroupEntity ToGroupEntity(string sessionIdentity, Group group)
    {
        return new GroupEntity
        {
            SessionIdentity = sessionIdentity,
            Name = group.Name,
            ScribeParticipantId = group.Scribe?.Value.ToString(),
            IsSubmitted = group.IsSubmitted,
            Members = group
                .Members.Select(participantId => new GroupMemberEntity
                {
                    ParticipantId = participantId.Value.ToString(),
                })
                .ToList(),
            AssignedValues = group
                .AssignedValues.Select(valueId => new GroupAssignedValueEntity
                {
                    ValueId = valueId.Value,
                })
                .ToList(),
        };
    }
}
