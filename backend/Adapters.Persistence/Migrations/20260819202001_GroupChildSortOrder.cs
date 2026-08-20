using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ValuesWorkshop.Adapters.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class GroupChildSortOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "sort_order",
                table: "group_members",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0
            );

            migrationBuilder.AddColumn<int>(
                name: "sort_order",
                table: "group_assigned_values",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "sort_order", table: "group_members");

            migrationBuilder.DropColumn(name: "sort_order", table: "group_assigned_values");
        }
    }
}
