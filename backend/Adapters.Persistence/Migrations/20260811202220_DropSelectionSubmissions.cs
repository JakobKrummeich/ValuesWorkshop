using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ValuesWorkshop.Adapters.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class DropSelectionSubmissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "selection_submissions");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "selection_submissions",
                columns: table => new
                {
                    session_identity = table.Column<string>(type: "TEXT", nullable: false),
                    participant_id = table.Column<string>(type: "TEXT", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_selection_submissions",
                        x => new { x.session_identity, x.participant_id }
                    );
                    table.ForeignKey(
                        name: "FK_selection_submissions_sessions_session_identity",
                        column: x => x.session_identity,
                        principalTable: "sessions",
                        principalColumn: "identity",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );
        }
    }
}
