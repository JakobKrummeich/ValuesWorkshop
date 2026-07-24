using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ValuesWorkshop.Adapters.Persistence.Entities;

namespace ValuesWorkshop.Adapters.Persistence;

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
        builder
            .HasOne(winner => winner.Session)
            .WithMany(session => session.WinningValues)
            .HasForeignKey(winner => winner.SessionIdentity);
    }
}
