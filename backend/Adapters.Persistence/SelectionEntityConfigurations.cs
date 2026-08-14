using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ValuesWorkshop.Adapters.Persistence.Entities;

namespace ValuesWorkshop.Adapters.Persistence;

internal sealed class ValueSelectionEntityConfiguration
    : IEntityTypeConfiguration<ValueSelectionEntity>
{
    public void Configure(EntityTypeBuilder<ValueSelectionEntity> builder)
    {
        builder.ToTable("value_selections");
        builder.HasKey(selection => new
        {
            selection.SessionIdentity,
            selection.ParticipantId,
            selection.ValueId,
        });
        builder.Property(selection => selection.SessionIdentity).HasColumnName("session_identity");
        builder.Property(selection => selection.ParticipantId).HasColumnName("participant_id");
        builder.Property(selection => selection.ValueId).HasColumnName("value_id");
        builder
            .HasOne(selection => selection.Session)
            .WithMany(session => session.ValueSelections)
            .HasForeignKey(selection => selection.SessionIdentity);
    }
}

internal sealed class TopValueEntityConfiguration : IEntityTypeConfiguration<TopValueEntity>
{
    public void Configure(EntityTypeBuilder<TopValueEntity> builder)
    {
        builder.ToTable("top_values");
        builder.HasKey(topValue => new { topValue.SessionIdentity, topValue.ValueId });
        builder.Property(topValue => topValue.SessionIdentity).HasColumnName("session_identity");
        builder.Property(topValue => topValue.ValueId).HasColumnName("value_id");
        builder
            .HasOne(topValue => topValue.Session)
            .WithMany(session => session.TopValues)
            .HasForeignKey(topValue => topValue.SessionIdentity);
    }
}
