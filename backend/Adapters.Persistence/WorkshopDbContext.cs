using Microsoft.EntityFrameworkCore;
using ValuesWorkshop.Adapters.Persistence.Entities;

namespace ValuesWorkshop.Adapters.Persistence;

public sealed class WorkshopDbContext(DbContextOptions<WorkshopDbContext> options)
    : DbContext(options)
{
    public DbSet<SessionEntity> Sessions => Set<SessionEntity>();
    public DbSet<QuizStateEntity> QuizStates => Set<QuizStateEntity>();
    public DbSet<PresentationStateEntity> PresentationStates => Set<PresentationStateEntity>();
    public DbSet<VotingStateEntity> VotingStates => Set<VotingStateEntity>();
    public DbSet<ParticipantEntity> Participants => Set<ParticipantEntity>();
    public DbSet<QuizAnswerEntity> QuizAnswers => Set<QuizAnswerEntity>();
    public DbSet<ValueSelectionEntity> ValueSelections => Set<ValueSelectionEntity>();
    public DbSet<SelectionSubmissionEntity> SelectionSubmissions =>
        Set<SelectionSubmissionEntity>();
    public DbSet<TopValueEntity> TopValues => Set<TopValueEntity>();
    public DbSet<GroupEntity> Groups => Set<GroupEntity>();
    public DbSet<GroupMemberEntity> GroupMembers => Set<GroupMemberEntity>();
    public DbSet<GroupAssignedValueEntity> GroupAssignedValues => Set<GroupAssignedValueEntity>();
    public DbSet<GroupActionEntity> GroupActions => Set<GroupActionEntity>();
    public DbSet<VoteTallyEntity> VoteTallies => Set<VoteTallyEntity>();
    public DbSet<VotedParticipantEntity> VotedParticipants => Set<VotedParticipantEntity>();
    public DbSet<WinningValueEntity> WinningValues => Set<WinningValueEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new SessionEntityConfiguration());
        modelBuilder.ApplyConfiguration(new QuizStateEntityConfiguration());
        modelBuilder.ApplyConfiguration(new PresentationStateEntityConfiguration());
        modelBuilder.ApplyConfiguration(new VotingStateEntityConfiguration());
        modelBuilder.ApplyConfiguration(new ParticipantEntityConfiguration());
        modelBuilder.ApplyConfiguration(new QuizAnswerEntityConfiguration());
        modelBuilder.ApplyConfiguration(new ValueSelectionEntityConfiguration());
        modelBuilder.ApplyConfiguration(new SelectionSubmissionEntityConfiguration());
        modelBuilder.ApplyConfiguration(new TopValueEntityConfiguration());
        modelBuilder.ApplyConfiguration(new GroupEntityConfiguration());
        modelBuilder.ApplyConfiguration(new GroupMemberEntityConfiguration());
        modelBuilder.ApplyConfiguration(new GroupAssignedValueEntityConfiguration());
        modelBuilder.ApplyConfiguration(new GroupActionEntityConfiguration());
        modelBuilder.ApplyConfiguration(new VoteTallyEntityConfiguration());
        modelBuilder.ApplyConfiguration(new VotedParticipantEntityConfiguration());
        modelBuilder.ApplyConfiguration(new WinningValueEntityConfiguration());
    }
}
