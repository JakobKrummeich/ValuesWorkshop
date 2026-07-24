using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ValuesWorkshop.Adapters.Persistence.Entities;

namespace ValuesWorkshop.Adapters.Persistence;

internal sealed class GroupEntityConfiguration : IEntityTypeConfiguration<GroupEntity>
{
    public void Configure(EntityTypeBuilder<GroupEntity> builder)
    {
        builder.ToTable("groups");
        builder.HasKey(group => group.Id);
        builder.Property(group => group.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(group => group.SessionIdentity).HasColumnName("session_identity");
        builder.Property(group => group.Name).HasColumnName("name");
        builder.Property(group => group.ScribeParticipantId).HasColumnName("scribe_participant_id");
        builder.Property(group => group.IsSubmitted).HasColumnName("is_submitted");
        builder
            .HasOne(group => group.Session)
            .WithMany(session => session.Groups)
            .HasForeignKey(group => group.SessionIdentity);
    }
}

internal sealed class GroupMemberEntityConfiguration : IEntityTypeConfiguration<GroupMemberEntity>
{
    public void Configure(EntityTypeBuilder<GroupMemberEntity> builder)
    {
        builder.ToTable("group_members");
        builder.HasKey(member => new { member.GroupId, member.ParticipantId });
        builder.Property(member => member.GroupId).HasColumnName("group_id");
        builder.Property(member => member.ParticipantId).HasColumnName("participant_id");
        builder
            .HasOne(member => member.Group)
            .WithMany(group => group.Members)
            .HasForeignKey(member => member.GroupId);
    }
}

internal sealed class GroupAssignedValueEntityConfiguration
    : IEntityTypeConfiguration<GroupAssignedValueEntity>
{
    public void Configure(EntityTypeBuilder<GroupAssignedValueEntity> builder)
    {
        builder.ToTable("group_assigned_values");
        builder.HasKey(assignedValue => new { assignedValue.GroupId, assignedValue.ValueId });
        builder.Property(assignedValue => assignedValue.GroupId).HasColumnName("group_id");
        builder.Property(assignedValue => assignedValue.ValueId).HasColumnName("value_id");
        builder
            .HasOne(assignedValue => assignedValue.Group)
            .WithMany(group => group.AssignedValues)
            .HasForeignKey(assignedValue => assignedValue.GroupId);
    }
}

internal sealed class GroupActionEntityConfiguration : IEntityTypeConfiguration<GroupActionEntity>
{
    public void Configure(EntityTypeBuilder<GroupActionEntity> builder)
    {
        builder.ToTable("group_actions");
        builder.HasKey(action => action.Id);
        builder.Property(action => action.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(action => action.GroupId).HasColumnName("group_id");
        builder.Property(action => action.ValueId).HasColumnName("value_id");
        builder.Property(action => action.Text).HasColumnName("text");
        builder.Property(action => action.SortOrder).HasColumnName("sort_order");
        builder
            .HasOne(action => action.Group)
            .WithMany(group => group.Actions)
            .HasForeignKey(action => action.GroupId);
    }
}
