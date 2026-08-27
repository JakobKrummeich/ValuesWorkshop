using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ValuesWorkshop.Adapters.Persistence.Entities;

namespace ValuesWorkshop.Adapters.Persistence;

internal sealed class VotingRoundEntityConfiguration : IEntityTypeConfiguration<VotingRoundEntity>
{
    public void Configure(EntityTypeBuilder<VotingRoundEntity> builder)
    {
        builder.ToTable("voting_rounds");
        builder.HasKey(round => new { round.SessionIdentity, round.RoundNumber });
        builder.Property(round => round.SessionIdentity).HasColumnName("session_identity");
        builder.Property(round => round.RoundNumber).HasColumnName("round_number");
        builder.Property(round => round.Allotment).HasColumnName("allotment");
        builder.Property(round => round.VotedCount).HasColumnName("voted_count");
        builder
            .HasOne(round => round.Session)
            .WithMany(session => session.VotingRounds)
            .HasForeignKey(round => round.SessionIdentity);
    }
}

internal sealed class VotingRoundTieEntityConfiguration
    : IEntityTypeConfiguration<VotingRoundTieEntity>
{
    public void Configure(EntityTypeBuilder<VotingRoundTieEntity> builder)
    {
        builder.ToTable("voting_round_ties");
        builder.HasKey(tie => new
        {
            tie.SessionIdentity,
            tie.RoundNumber,
            tie.ValueId,
        });
        builder.Property(tie => tie.SessionIdentity).HasColumnName("session_identity");
        builder.Property(tie => tie.RoundNumber).HasColumnName("round_number");
        builder.Property(tie => tie.ValueId).HasColumnName("value_id");
        builder.Property(tie => tie.SortOrder).HasColumnName("sort_order");
        builder
            .HasOne(tie => tie.Session)
            .WithMany(session => session.VotingRoundTies)
            .HasForeignKey(tie => tie.SessionIdentity);
    }
}

internal sealed class VoteTallyEntityConfiguration : IEntityTypeConfiguration<VoteTallyEntity>
{
    public void Configure(EntityTypeBuilder<VoteTallyEntity> builder)
    {
        builder.ToTable("vote_tallies");
        builder.HasKey(tally => new
        {
            tally.SessionIdentity,
            tally.RoundNumber,
            tally.ValueId,
        });
        builder.Property(tally => tally.SessionIdentity).HasColumnName("session_identity");
        builder.Property(tally => tally.RoundNumber).HasColumnName("round_number");
        builder.Property(tally => tally.ValueId).HasColumnName("value_id");
        builder.Property(tally => tally.VoteCount).HasColumnName("vote_count");
        builder.Property(tally => tally.SortOrder).HasColumnName("sort_order");
        builder
            .HasOne(tally => tally.Session)
            .WithMany(session => session.VoteTallies)
            .HasForeignKey(tally => tally.SessionIdentity);
    }
}

internal sealed class VotedParticipantEntityConfiguration
    : IEntityTypeConfiguration<VotedParticipantEntity>
{
    public void Configure(EntityTypeBuilder<VotedParticipantEntity> builder)
    {
        builder.ToTable("voted_participants");
        builder.HasKey(voted => new
        {
            voted.SessionIdentity,
            voted.RoundNumber,
            voted.ParticipantId,
        });
        builder.Property(voted => voted.SessionIdentity).HasColumnName("session_identity");
        builder.Property(voted => voted.RoundNumber).HasColumnName("round_number");
        builder.Property(voted => voted.ParticipantId).HasColumnName("participant_id");
        builder
            .HasOne(voted => voted.Session)
            .WithMany(session => session.VotedParticipants)
            .HasForeignKey(voted => voted.SessionIdentity);
    }
}

internal sealed class WinningValueEntityConfiguration : IEntityTypeConfiguration<WinningValueEntity>
{
    public void Configure(EntityTypeBuilder<WinningValueEntity> builder)
    {
        builder.ToTable("winning_values");
        builder.HasKey(winner => new { winner.SessionIdentity, winner.ValueId });
        builder.Property(winner => winner.SessionIdentity).HasColumnName("session_identity");
        builder.Property(winner => winner.ValueId).HasColumnName("value_id");
        builder.Property(winner => winner.Rank).HasColumnName("rank");
        builder.Property(winner => winner.RoundNumber).HasColumnName("round_number");
        builder
            .HasOne(winner => winner.Session)
            .WithMany(session => session.WinningValues)
            .HasForeignKey(winner => winner.SessionIdentity);
    }
}
