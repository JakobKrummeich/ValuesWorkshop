using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ValuesWorkshop.Adapters.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class GroupActionIdentity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "action_id",
                table: "group_actions",
                type: "TEXT",
                nullable: false,
                defaultValue: ""
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "action_id", table: "group_actions");
        }
    }
}
