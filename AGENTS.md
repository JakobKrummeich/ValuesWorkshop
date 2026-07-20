# Agent Workflow

Key files: `SPEC.md` (product spec) · `tasks/plan.md` (macro plan, locked
decisions) · `tasks/todo.md` (ordered backlog) · `CLEANROOM.md` (never look
at the old repo).

## Per-task skill chain (in this order)

1. **spec-driven-development** → write `tasks/specs/NN-<name>.md` (mini-spec;
   S task ≈ 10 lines), user approves before code
2. **planning-and-task-breakdown** → slice list inside the same file
3. **test-driven-development** + **incremental-implementation** → implement
   on a feature branch
4. **code-review-and-quality** → fix findings
5. **code-simplification** → fix findings
6. **no-mistakes** → validate, open PR (skip during Phase 0 / doc-only tasks)

At every checkpoint: re-groom the next phase's tasks in `tasks/todo.md`
against learnings; update `SPEC.md` in the same PR if a decision changed.

User review of design artifacts: HTML artifact + `lavish-axi` (see handoffs).
