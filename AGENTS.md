# Agent Workflow

Key files: `SPEC.md` (product spec) · `tasks/plan.md` (macro plan, locked
decisions) · `tasks/todo.md` (ordered backlog) · `CLEANROOM.md` (never look
at the old repo).

## Hard rules

NEVER commit secrets. NEVER commit PII. NEVER weaken quality guardrails.
NEVER disable quality guardrails. RARELY use code comments.
Naming: language defaults — FE/TS camelCase (hooks must be `use`-camelCase);
C# PascalCase for types/properties/methods, camelCase for locals/params.
CSS: co-locate `Component.module.css` next to its `Component.tsx` — one CSS
module per component, no shared/global component stylesheets.
C#: records by default, wherever possible — value objects, DTOs, messages,
commands/events always records; a mutable class needs written justification.
Mind record collection-property equality (reference-based; use immutable
collections or custom equality where equality matters). Aggregate style
(immutable record transitions vs. class) is decided in `design/architecture.md`
(Task 4).

- When making technical decisions, do not give much weight to development cost.
  Instead, prefer quality, simplicity, robustness, scalability, and long term maintainability.
- When doing bug fixes, always start with reproducing the bug in an E2E setting as closely aligned with how an end user would experience it as possible.
  This makes sure you find the real problem so your fix will actually solve it.
- When end-to-end testing a product, be picky about the UI you see and be obsessed with pixel perfection.
  If something clearly looks off, even if it is not directly related to what you are doing, try to get it fixed along the way.
- Apply that same high standard to engineering excellence: lint, test failures, and test flakiness.
  If you see one, even if it is not caused by what you are working on right now, still get it fixed.

## Per-task skill chain (in this order)

1. **spec-driven-development** → write `tasks/specs/NN-<name>.md` (mini-spec;
   S task ≈ 10 lines), user approves before code
2. **planning-and-task-breakdown** → slice list inside the same file
3. **test-driven-development** + **incremental-implementation** → implement
   on a feature branch
4. **code-review-and-quality** → fix findings
5. **code-simplification** → fix findings
6. **no-mistakes** → validate, open PR (skip during Phase 0 / doc-only tasks).
   The gate does NOT watch pushes to an open PR: any code follow-up pushed to
   a PR branch must be re-validated (`no-mistakes rerun` or a fresh `axi run`);
   only doc-only follow-ups may push directly.

At every checkpoint: re-groom the next phase's tasks in `tasks/todo.md`
against learnings; update `SPEC.md` in the same PR if a decision changed.

## Quality Gate Scripts

Run all quality gates locally using the same commands CI uses:

- `./scripts/ci-lint.sh` — all lint gates (FE lint, FE build, BE build/analyzers,
  CSharpier, vulnerability scan, jscpd duplication)
- `./scripts/ci-test.sh` — all test gates (FE jest + coverage, BE dotnet
  test + coverage)
- `./scripts/test-backend-with-coverage.sh` — BE test + coverage gate standalone
- `./scripts/check-backend-vulnerabilities.sh` — BE vulnerability scan standalone

## User review — always Lavish

Everything needing user review/approval (mini-specs, design docs, checkpoint
gates) goes through an HTML artifact + `npx lavish-axi <file>` — never "read
the file in the repo". Reason (non-discoverable): agent runs on a VPS; the
user has no easy access to repo files. Print the session URL immediately.
Never reopen a user-ended session without `--reopen` + invite.

When polling for Lavish feedback (`lavish-axi poll`), NEVER set a timer.
The poll is a blocking foreground call — let it run until the user responds
or the harness kills it. If it times out, immediately re-poll. Timers
interrupt the poll and cause lost feedback.
