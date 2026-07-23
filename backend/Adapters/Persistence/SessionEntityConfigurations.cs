using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ValuesWorkshop.Adapters.Persistence.Entities;

namespace ValuesWorkshop.Adapters.Persistence;

internal sealed class SessionEntityConfiguration : IEntityTypeConfiguration<SessionEntity>
{
    public void Configure(EntityTypeBuilder<SessionEntity> builder)
    {
        builder.ToTable("sessions");
        builder.HasKey(session => session.Identity);
        builder.Property(session => session.Identity).HasColumnName("identity");
        builder.Property(session => session.CurrentPhase).HasColumnName("current_phase");
        builder.Property(session => session.IsFormed).HasColumnName("is_formed");
        builder.Property(session => session.CreatedAt).HasColumnName("created_at");
    }
}

internal sealed class QuizStateEntityConfiguration : IEntityTypeConfiguration<QuizStateEntity>
{
    public void Configure(EntityTypeBuilder<QuizStateEntity> builder)
    {
        builder.ToTable("quiz_state");
        builder.HasKey(quiz => quiz.SessionIdentity);
        builder.Property(quiz => quiz.SessionIdentity).HasColumnName("session_identity");
        builder.Property(quiz => quiz.CurrentQuestionIndex).HasColumnName("current_question_index");
        builder.Property(quiz => quiz.IsRevealed).HasColumnName("is_revealed");
        builder.Property(quiz => quiz.IsLearningTextShown).HasColumnName("is_learning_text_shown");
        builder
            .HasOne(quiz => quiz.Session)
            .WithOne(session => session.QuizState)
            .HasForeignKey<QuizStateEntity>(quiz => quiz.SessionIdentity);
    }
}

internal sealed class PresentationStateEntityConfiguration
    : IEntityTypeConfiguration<PresentationStateEntity>
{
    public void Configure(EntityTypeBuilder<PresentationStateEntity> builder)
    {
        builder.ToTable("presentation_state");
        builder.HasKey(presentation => presentation.SessionIdentity);
        builder
            .Property(presentation => presentation.SessionIdentity)
            .HasColumnName("session_identity");
        builder
            .Property(presentation => presentation.PresentingGroupName)
            .HasColumnName("presenting_group_name");
        builder
            .Property(presentation => presentation.PresentedValueId)
            .HasColumnName("presented_value_id");
        builder
            .HasOne(presentation => presentation.Session)
            .WithOne(session => session.PresentationState)
            .HasForeignKey<PresentationStateEntity>(presentation => presentation.SessionIdentity);
    }
}

internal sealed class VotingStateEntityConfiguration : IEntityTypeConfiguration<VotingStateEntity>
{
    public void Configure(EntityTypeBuilder<VotingStateEntity> builder)
    {
        builder.ToTable("voting_state");
        builder.HasKey(voting => voting.SessionIdentity);
        builder.Property(voting => voting.SessionIdentity).HasColumnName("session_identity");
        builder.Property(voting => voting.RoundOpen).HasColumnName("round_open");
        builder.Property(voting => voting.RoundNumber).HasColumnName("round_number");
        builder
            .HasOne(voting => voting.Session)
            .WithOne(session => session.VotingState)
            .HasForeignKey<VotingStateEntity>(voting => voting.SessionIdentity);
    }
}

internal sealed class ParticipantEntityConfiguration : IEntityTypeConfiguration<ParticipantEntity>
{
    public void Configure(EntityTypeBuilder<ParticipantEntity> builder)
    {
        builder.ToTable("participants");
        builder.HasKey(participant => participant.Id);
        builder.Property(participant => participant.Id).HasColumnName("id");
        builder
            .Property(participant => participant.SessionIdentity)
            .HasColumnName("session_identity");
        builder
            .HasOne(participant => participant.Session)
            .WithMany(session => session.Participants)
            .HasForeignKey(participant => participant.SessionIdentity);
    }
}

internal sealed class QuizAnswerEntityConfiguration : IEntityTypeConfiguration<QuizAnswerEntity>
{
    public void Configure(EntityTypeBuilder<QuizAnswerEntity> builder)
    {
        builder.ToTable("quiz_answers");
        builder.HasKey(answer => new
        {
            answer.SessionIdentity,
            answer.QuestionIndex,
            answer.ParticipantId,
        });
        builder.Property(answer => answer.SessionIdentity).HasColumnName("session_identity");
        builder.Property(answer => answer.QuestionIndex).HasColumnName("question_index");
        builder.Property(answer => answer.ParticipantId).HasColumnName("participant_id");
        builder.Property(answer => answer.AnswerIndex).HasColumnName("answer_index");
        builder
            .HasOne(answer => answer.Session)
            .WithMany(session => session.QuizAnswers)
            .HasForeignKey(answer => answer.SessionIdentity);
    }
}
