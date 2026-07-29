---
name: lightspeed
description: Get a human review of a branch diff. Use when work is ready for review, when a reviewer asked to see changes in a browser, or when you need targeted feedback on specific lines rather than a summary.
---

# lightspeed

Semantic diff review: a reviewer reads your branch diff in a browser, selects
the lines they care about and sends comments back to you, one round at a time.

## The loop

1. **Show the diff.**
   > Run `lightspeed start <branch> [base] --intent "<why this branch exists>"` to open a review session; repeat --intent once per reason

   It extracts `git diff <base>...<branch>`, groups the files, opens the
   reviewer's browser and prints the session URL.

   `--intent` is **required**. You opened the review, so you are the only party
   that knows why the branch exists — the reviewer reads it above the diff and
   the grouping model reads it as the strongest signal it gets. Repeat the flag
   once per reason:

   ```sh
   lightspeed start feature-auth main \
     --intent "replace session cookies with signed tokens" \
     --intent "drop the legacy /login handler"
   ```

   Omitting it fails with `intent_missing` before any git or model work.
2. **Wait for feedback.**
   > Run `lightspeed poll <branch> [base]` in the foreground to wait for reviewer feedback — it blocks until the reviewer sends, so never background it or wrap it in a timeout

   A poll that is backgrounded or timed out loses the reviewer's feedback.
3. **Address what came back.** Each prompt names the file, the group and the
   exact text the reviewer selected. Fix, commit, then run `start` again:
   it is idempotent, re-groups the fresh diff and keeps the conversation.
   Files the reviewer already approved come back ticked and dimmed unless you
   touched them, so each round shows the reviewer only what is new work.
4. **Keep the reviewer in the loop.** Reply while you work with
   `lightspeed poll <branch> [base] --agent-reply "<summary>"`.
5. **Close it.**
   > Run `lightspeed end <branch> [base]` to close a session

## Rules

- Run `poll` in the foreground, every time. It has no timeout by design.
- `Send & End` from the reviewer ends the review; poll reports `ended: true`.
  `start` on an ended review is refused with `session_ended`. When the reviewer
  asks for another round — and only then — run
  `lightspeed start <branch> [base] --reopen`.
- Every command takes `<branch> [base]` explicitly, which is what makes
  concurrent reviews unambiguous. Omit the branch only when the repository has
  exactly one live session.
- `base` defaults to `main`.
- State the intent in the reviewer's terms — what the branch is for, not a list
  of the files you touched. They can already see the files.

## Setup

The repository needs `.lightspeed.conf.json` in its root:

```json
{ "model": "<provider/model>", "thinking": "off" }
```

Optional keys: `port` (4388), `stateDir` (`~/.lightspeed`),
`feedbackLog` (`on`).

## Output

Every command answers TOON on stdout with a `help[]` block of next steps, and
every failure answers `error: {code, message, detail}` plus `help[]` — exit 2
when the command line itself is wrong (unknown command, subcommand or flag, a
missing or unparseable argument), exit 1 for everything else. Run
`lightspeed <command> --help` for a command's flags.
