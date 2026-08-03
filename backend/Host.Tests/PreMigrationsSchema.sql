CREATE TABLE "group_actions" (
    "id" INTEGER NOT NULL CONSTRAINT "PK_group_actions" PRIMARY KEY AUTOINCREMENT,
    "group_id" INTEGER NOT NULL,
    "value_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    CONSTRAINT "FK_group_actions_groups_group_id" FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE CASCADE
);

CREATE TABLE "group_assigned_values" (
    "group_id" INTEGER NOT NULL,
    "value_id" TEXT NOT NULL,
    CONSTRAINT "PK_group_assigned_values" PRIMARY KEY ("group_id", "value_id"),
    CONSTRAINT "FK_group_assigned_values_groups_group_id" FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE CASCADE
);

CREATE TABLE "group_members" (
    "group_id" INTEGER NOT NULL,
    "participant_id" TEXT NOT NULL,
    CONSTRAINT "PK_group_members" PRIMARY KEY ("group_id", "participant_id"),
    CONSTRAINT "FK_group_members_groups_group_id" FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE CASCADE
);

CREATE TABLE "groups" (
    "id" INTEGER NOT NULL CONSTRAINT "PK_groups" PRIMARY KEY AUTOINCREMENT,
    "session_identity" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scribe_participant_id" TEXT NULL,
    "is_submitted" INTEGER NOT NULL,
    CONSTRAINT "FK_groups_sessions_session_identity" FOREIGN KEY ("session_identity") REFERENCES "sessions" ("identity") ON DELETE CASCADE
);

CREATE TABLE "participants" (
    "id" TEXT NOT NULL CONSTRAINT "PK_participants" PRIMARY KEY,
    "session_identity" TEXT NOT NULL,
    CONSTRAINT "FK_participants_sessions_session_identity" FOREIGN KEY ("session_identity") REFERENCES "sessions" ("identity") ON DELETE CASCADE
);

CREATE TABLE "presentation_state" (
    "session_identity" TEXT NOT NULL CONSTRAINT "PK_presentation_state" PRIMARY KEY,
    "presenting_group_name" TEXT NULL,
    "presented_value_id" TEXT NULL,
    CONSTRAINT "FK_presentation_state_sessions_session_identity" FOREIGN KEY ("session_identity") REFERENCES "sessions" ("identity") ON DELETE CASCADE
);

CREATE TABLE "quiz_answers" (
    "session_identity" TEXT NOT NULL,
    "question_index" INTEGER NOT NULL,
    "participant_id" TEXT NOT NULL,
    "answer_index" INTEGER NOT NULL,
    CONSTRAINT "PK_quiz_answers" PRIMARY KEY ("session_identity", "question_index", "participant_id"),
    CONSTRAINT "FK_quiz_answers_sessions_session_identity" FOREIGN KEY ("session_identity") REFERENCES "sessions" ("identity") ON DELETE CASCADE
);

CREATE TABLE "quiz_state" (
    "session_identity" TEXT NOT NULL CONSTRAINT "PK_quiz_state" PRIMARY KEY,
    "current_question_index" INTEGER NULL,
    "is_revealed" INTEGER NOT NULL,
    "is_learning_text_shown" INTEGER NOT NULL,
    CONSTRAINT "FK_quiz_state_sessions_session_identity" FOREIGN KEY ("session_identity") REFERENCES "sessions" ("identity") ON DELETE CASCADE
);

CREATE TABLE "selection_submissions" (
    "session_identity" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    CONSTRAINT "PK_selection_submissions" PRIMARY KEY ("session_identity", "participant_id"),
    CONSTRAINT "FK_selection_submissions_sessions_session_identity" FOREIGN KEY ("session_identity") REFERENCES "sessions" ("identity") ON DELETE CASCADE
);

CREATE TABLE "sessions" (
    "identity" TEXT NOT NULL CONSTRAINT "PK_sessions" PRIMARY KEY,
    "facilitator_subject" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "current_phase" INTEGER NOT NULL,
    "revision" INTEGER NOT NULL,
    "is_formed" INTEGER NOT NULL,
    "created_at" TEXT NOT NULL
);

CREATE TABLE "top_values" (
    "session_identity" TEXT NOT NULL,
    "value_id" TEXT NOT NULL,
    CONSTRAINT "PK_top_values" PRIMARY KEY ("session_identity", "value_id"),
    CONSTRAINT "FK_top_values_sessions_session_identity" FOREIGN KEY ("session_identity") REFERENCES "sessions" ("identity") ON DELETE CASCADE
);

CREATE TABLE "value_selections" (
    "session_identity" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "value_id" TEXT NOT NULL,
    CONSTRAINT "PK_value_selections" PRIMARY KEY ("session_identity", "participant_id", "value_id"),
    CONSTRAINT "FK_value_selections_sessions_session_identity" FOREIGN KEY ("session_identity") REFERENCES "sessions" ("identity") ON DELETE CASCADE
);

CREATE TABLE "vote_tallies" (
    "session_identity" TEXT NOT NULL,
    "round_number" INTEGER NOT NULL,
    "value_id" TEXT NOT NULL,
    "vote_count" INTEGER NOT NULL,
    CONSTRAINT "PK_vote_tallies" PRIMARY KEY ("session_identity", "round_number", "value_id"),
    CONSTRAINT "FK_vote_tallies_sessions_session_identity" FOREIGN KEY ("session_identity") REFERENCES "sessions" ("identity") ON DELETE CASCADE
);

CREATE TABLE "voted_participants" (
    "session_identity" TEXT NOT NULL,
    "round_number" INTEGER NOT NULL,
    "participant_id" TEXT NOT NULL,
    CONSTRAINT "PK_voted_participants" PRIMARY KEY ("session_identity", "round_number", "participant_id"),
    CONSTRAINT "FK_voted_participants_sessions_session_identity" FOREIGN KEY ("session_identity") REFERENCES "sessions" ("identity") ON DELETE CASCADE
);

CREATE TABLE "voting_state" (
    "session_identity" TEXT NOT NULL CONSTRAINT "PK_voting_state" PRIMARY KEY,
    "round_open" INTEGER NOT NULL,
    "round_number" INTEGER NOT NULL,
    CONSTRAINT "FK_voting_state_sessions_session_identity" FOREIGN KEY ("session_identity") REFERENCES "sessions" ("identity") ON DELETE CASCADE
);

CREATE TABLE "winning_values" (
    "session_identity" TEXT NOT NULL,
    "value_id" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    CONSTRAINT "PK_winning_values" PRIMARY KEY ("session_identity", "value_id"),
    CONSTRAINT "FK_winning_values_sessions_session_identity" FOREIGN KEY ("session_identity") REFERENCES "sessions" ("identity") ON DELETE CASCADE
);

CREATE INDEX "IX_group_actions_group_id" ON "group_actions" ("group_id");

CREATE INDEX "IX_groups_session_identity" ON "groups" ("session_identity");

CREATE INDEX "IX_participants_session_identity" ON "participants" ("session_identity");
