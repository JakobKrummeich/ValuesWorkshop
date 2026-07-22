using ValuesWorkshop.Adapters.Persistence.Entities;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Persistence;

internal static class DomainEntityMapper
{
    internal static SessionEntity ToEntity(string sessionIdentity, Session session)
    {
        return new SessionEntity
        {
            Identity = sessionIdentity,
            CurrentPhase = (int)session.State.CurrentPhase,
            IsFormed = session.Formation.IsFormed,
            CreatedAt = DateTime.UtcNow.ToString("o"),
            QuizState = new QuizStateEntity
            {
                SessionIdentity = sessionIdentity,
                CurrentQuestionIndex = session.Quiz.CurrentQuestion,
                IsRevealed = session.Quiz.IsRevealed,
                IsLearningTextShown = session.Quiz.IsLearningTextShown,
            },
            PresentationState = new PresentationStateEntity
            {
                SessionIdentity = sessionIdentity,
                PresentingGroupName = session.Presentation.PresentingGroup,
                PresentedValueId = session.Presentation.PresentedValue?.Value,
            },
            VotingState = new VotingStateEntity
            {
                SessionIdentity = sessionIdentity,
                RoundOpen = session.Voting.RoundOpen,
                RoundNumber = session.Voting.RoundNumber,
            },
            Participants = session
                .Roster.Participants.Select(participantId => new ParticipantEntity
                {
                    Id = participantId.Value.ToString(),
                    SessionIdentity = sessionIdentity,
                })
                .ToList(),
            SelectionSubmissions = session
                .Selection.SubmittedBy.Select(participantId => new SelectionSubmissionEntity
                {
                    SessionIdentity = sessionIdentity,
                    ParticipantId = participantId.Value.ToString(),
                })
                .ToList(),
            TopValues = session
                .Selection.TopValues.Select(valueId => new TopValueEntity
                {
                    SessionIdentity = sessionIdentity,
                    ValueId = valueId.Value,
                })
                .ToList(),
            Groups = session
                .Formation.Groups.Select(group => ToGroupEntity(sessionIdentity, group))
                .ToList(),
            WinningValues = session
                .Voting.WinningValues.Select(
                    (valueId, index) =>
                        new WinningValueEntity
                        {
                            SessionIdentity = sessionIdentity,
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
            entity.Participants.Select(participant => new ParticipantId(Guid.Parse(participant.Id)))
        );

        var state = WorkshopState.Restore((Phase)entity.CurrentPhase);

        var quiz = QuizProgress.Restore(
            entity.QuizState.CurrentQuestionIndex,
            entity.QuizState.IsRevealed,
            entity.QuizState.IsLearningTextShown
        );

        var selection = SelectionRound.Restore(
            entity.SelectionSubmissions.Select(submission => new ParticipantId(
                Guid.Parse(submission.ParticipantId)
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
                : null
        );

        var voting = VotingRounds.Restore(
            entity.VotingState.RoundOpen,
            entity.VotingState.RoundNumber,
            entity
                .WinningValues.OrderBy(winner => winner.Rank)
                .Select(winner => new ValueId(winner.ValueId))
        );

        return Session.Restore(roster, state, quiz, selection, formation, presentation, voting);
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
