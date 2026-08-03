using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ValuesWorkshop.Adapters.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "sessions",
                columns: table => new
                {
                    identity = table.Column<string>(type: "TEXT", nullable: false),
                    facilitator_subject = table.Column<string>(type: "TEXT", nullable: false),
                    name = table.Column<string>(type: "TEXT", nullable: false),
                    current_phase = table.Column<int>(type: "INTEGER", nullable: false),
                    revision = table.Column<long>(type: "INTEGER", nullable: false),
                    is_formed = table.Column<bool>(type: "INTEGER", nullable: false),
                    created_at = table.Column<string>(type: "TEXT", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sessions", x => x.identity);
                }
            );

            migrationBuilder.CreateTable(
                name: "groups",
                columns: table => new
                {
                    id = table
                        .Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    session_identity = table.Column<string>(type: "TEXT", nullable: false),
                    name = table.Column<string>(type: "TEXT", nullable: false),
                    scribe_participant_id = table.Column<string>(type: "TEXT", nullable: true),
                    is_submitted = table.Column<bool>(type: "INTEGER", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_groups", x => x.id);
                    table.ForeignKey(
                        name: "FK_groups_sessions_session_identity",
                        column: x => x.session_identity,
                        principalTable: "sessions",
                        principalColumn: "identity",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "participants",
                columns: table => new
                {
                    id = table.Column<string>(type: "TEXT", nullable: false),
                    session_identity = table.Column<string>(type: "TEXT", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_participants", x => x.id);
                    table.ForeignKey(
                        name: "FK_participants_sessions_session_identity",
                        column: x => x.session_identity,
                        principalTable: "sessions",
                        principalColumn: "identity",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "presentation_state",
                columns: table => new
                {
                    session_identity = table.Column<string>(type: "TEXT", nullable: false),
                    presenting_group_name = table.Column<string>(type: "TEXT", nullable: true),
                    presented_value_id = table.Column<string>(type: "TEXT", nullable: true),
                    shown_value_count = table.Column<int>(type: "INTEGER", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_presentation_state", x => x.session_identity);
                    table.ForeignKey(
                        name: "FK_presentation_state_sessions_session_identity",
                        column: x => x.session_identity,
                        principalTable: "sessions",
                        principalColumn: "identity",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "quiz_answers",
                columns: table => new
                {
                    session_identity = table.Column<string>(type: "TEXT", nullable: false),
                    question_index = table.Column<int>(type: "INTEGER", nullable: false),
                    participant_id = table.Column<string>(type: "TEXT", nullable: false),
                    answer_index = table.Column<int>(type: "INTEGER", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_quiz_answers",
                        x => new
                        {
                            x.session_identity,
                            x.question_index,
                            x.participant_id,
                        }
                    );
                    table.ForeignKey(
                        name: "FK_quiz_answers_sessions_session_identity",
                        column: x => x.session_identity,
                        principalTable: "sessions",
                        principalColumn: "identity",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "quiz_state",
                columns: table => new
                {
                    session_identity = table.Column<string>(type: "TEXT", nullable: false),
                    current_question_index = table.Column<int>(type: "INTEGER", nullable: true),
                    is_revealed = table.Column<bool>(type: "INTEGER", nullable: false),
                    is_learning_text_shown = table.Column<bool>(type: "INTEGER", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_quiz_state", x => x.session_identity);
                    table.ForeignKey(
                        name: "FK_quiz_state_sessions_session_identity",
                        column: x => x.session_identity,
                        principalTable: "sessions",
                        principalColumn: "identity",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

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

            migrationBuilder.CreateTable(
                name: "top_values",
                columns: table => new
                {
                    session_identity = table.Column<string>(type: "TEXT", nullable: false),
                    value_id = table.Column<string>(type: "TEXT", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_top_values", x => new { x.session_identity, x.value_id });
                    table.ForeignKey(
                        name: "FK_top_values_sessions_session_identity",
                        column: x => x.session_identity,
                        principalTable: "sessions",
                        principalColumn: "identity",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "value_selections",
                columns: table => new
                {
                    session_identity = table.Column<string>(type: "TEXT", nullable: false),
                    participant_id = table.Column<string>(type: "TEXT", nullable: false),
                    value_id = table.Column<string>(type: "TEXT", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_value_selections",
                        x => new
                        {
                            x.session_identity,
                            x.participant_id,
                            x.value_id,
                        }
                    );
                    table.ForeignKey(
                        name: "FK_value_selections_sessions_session_identity",
                        column: x => x.session_identity,
                        principalTable: "sessions",
                        principalColumn: "identity",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "vote_tallies",
                columns: table => new
                {
                    session_identity = table.Column<string>(type: "TEXT", nullable: false),
                    round_number = table.Column<int>(type: "INTEGER", nullable: false),
                    value_id = table.Column<string>(type: "TEXT", nullable: false),
                    vote_count = table.Column<int>(type: "INTEGER", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_vote_tallies",
                        x => new
                        {
                            x.session_identity,
                            x.round_number,
                            x.value_id,
                        }
                    );
                    table.ForeignKey(
                        name: "FK_vote_tallies_sessions_session_identity",
                        column: x => x.session_identity,
                        principalTable: "sessions",
                        principalColumn: "identity",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "voted_participants",
                columns: table => new
                {
                    session_identity = table.Column<string>(type: "TEXT", nullable: false),
                    round_number = table.Column<int>(type: "INTEGER", nullable: false),
                    participant_id = table.Column<string>(type: "TEXT", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_voted_participants",
                        x => new
                        {
                            x.session_identity,
                            x.round_number,
                            x.participant_id,
                        }
                    );
                    table.ForeignKey(
                        name: "FK_voted_participants_sessions_session_identity",
                        column: x => x.session_identity,
                        principalTable: "sessions",
                        principalColumn: "identity",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "voting_state",
                columns: table => new
                {
                    session_identity = table.Column<string>(type: "TEXT", nullable: false),
                    round_open = table.Column<bool>(type: "INTEGER", nullable: false),
                    round_number = table.Column<int>(type: "INTEGER", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_voting_state", x => x.session_identity);
                    table.ForeignKey(
                        name: "FK_voting_state_sessions_session_identity",
                        column: x => x.session_identity,
                        principalTable: "sessions",
                        principalColumn: "identity",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "winning_values",
                columns: table => new
                {
                    session_identity = table.Column<string>(type: "TEXT", nullable: false),
                    value_id = table.Column<string>(type: "TEXT", nullable: false),
                    rank = table.Column<int>(type: "INTEGER", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_winning_values",
                        x => new { x.session_identity, x.value_id }
                    );
                    table.ForeignKey(
                        name: "FK_winning_values_sessions_session_identity",
                        column: x => x.session_identity,
                        principalTable: "sessions",
                        principalColumn: "identity",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "group_actions",
                columns: table => new
                {
                    id = table
                        .Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    group_id = table.Column<int>(type: "INTEGER", nullable: false),
                    value_id = table.Column<string>(type: "TEXT", nullable: false),
                    text = table.Column<string>(type: "TEXT", nullable: false),
                    sort_order = table.Column<int>(type: "INTEGER", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_group_actions", x => x.id);
                    table.ForeignKey(
                        name: "FK_group_actions_groups_group_id",
                        column: x => x.group_id,
                        principalTable: "groups",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "group_assigned_values",
                columns: table => new
                {
                    group_id = table.Column<int>(type: "INTEGER", nullable: false),
                    value_id = table.Column<string>(type: "TEXT", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_group_assigned_values",
                        x => new { x.group_id, x.value_id }
                    );
                    table.ForeignKey(
                        name: "FK_group_assigned_values_groups_group_id",
                        column: x => x.group_id,
                        principalTable: "groups",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "group_members",
                columns: table => new
                {
                    group_id = table.Column<int>(type: "INTEGER", nullable: false),
                    participant_id = table.Column<string>(type: "TEXT", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_group_members", x => new { x.group_id, x.participant_id });
                    table.ForeignKey(
                        name: "FK_group_members_groups_group_id",
                        column: x => x.group_id,
                        principalTable: "groups",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateIndex(
                name: "IX_group_actions_group_id",
                table: "group_actions",
                column: "group_id"
            );

            migrationBuilder.CreateIndex(
                name: "IX_groups_session_identity",
                table: "groups",
                column: "session_identity"
            );

            migrationBuilder.CreateIndex(
                name: "IX_participants_session_identity",
                table: "participants",
                column: "session_identity"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "group_actions");

            migrationBuilder.DropTable(name: "group_assigned_values");

            migrationBuilder.DropTable(name: "group_members");

            migrationBuilder.DropTable(name: "participants");

            migrationBuilder.DropTable(name: "presentation_state");

            migrationBuilder.DropTable(name: "quiz_answers");

            migrationBuilder.DropTable(name: "quiz_state");

            migrationBuilder.DropTable(name: "selection_submissions");

            migrationBuilder.DropTable(name: "top_values");

            migrationBuilder.DropTable(name: "value_selections");

            migrationBuilder.DropTable(name: "vote_tallies");

            migrationBuilder.DropTable(name: "voted_participants");

            migrationBuilder.DropTable(name: "voting_state");

            migrationBuilder.DropTable(name: "winning_values");

            migrationBuilder.DropTable(name: "groups");

            migrationBuilder.DropTable(name: "sessions");
        }
    }
}
