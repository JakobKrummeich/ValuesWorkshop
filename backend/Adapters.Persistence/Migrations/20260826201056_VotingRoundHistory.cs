using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ValuesWorkshop.Adapters.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class VotingRoundHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "round_number",
                table: "winning_values",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0
            );

            migrationBuilder.AddColumn<int>(
                name: "sort_order",
                table: "vote_tallies",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0
            );

            migrationBuilder.CreateTable(
                name: "voting_round_ties",
                columns: table => new
                {
                    session_identity = table.Column<string>(type: "TEXT", nullable: false),
                    round_number = table.Column<int>(type: "INTEGER", nullable: false),
                    value_id = table.Column<string>(type: "TEXT", nullable: false),
                    sort_order = table.Column<int>(type: "INTEGER", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_voting_round_ties",
                        x => new
                        {
                            x.session_identity,
                            x.round_number,
                            x.value_id,
                        }
                    );
                    table.ForeignKey(
                        name: "FK_voting_round_ties_sessions_session_identity",
                        column: x => x.session_identity,
                        principalTable: "sessions",
                        principalColumn: "identity",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "voting_rounds",
                columns: table => new
                {
                    session_identity = table.Column<string>(type: "TEXT", nullable: false),
                    round_number = table.Column<int>(type: "INTEGER", nullable: false),
                    allotment = table.Column<int>(type: "INTEGER", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_voting_rounds",
                        x => new { x.session_identity, x.round_number }
                    );
                    table.ForeignKey(
                        name: "FK_voting_rounds_sessions_session_identity",
                        column: x => x.session_identity,
                        principalTable: "sessions",
                        principalColumn: "identity",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "voting_round_ties");

            migrationBuilder.DropTable(name: "voting_rounds");

            migrationBuilder.DropColumn(name: "round_number", table: "winning_values");

            migrationBuilder.DropColumn(name: "sort_order", table: "vote_tallies");
        }
    }
}
