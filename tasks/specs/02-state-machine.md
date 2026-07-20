# Mini-Spec: Task 0.2 — Phase State Machine (domain level)

**Objective:** `design/state-machine.md` — Mermaid stateDiagram of the 9 phases
(forward-only) plus per-phase sub-states, in ubiquitous language from
`design/domain-model.md`. Commands/events consumed verbatim from 0.1.

**Content:** top-level diagram (9 phases, AdvancePhase transitions); sub-state
diagrams for Quiz (question index / revealed / learning text), Group work
(per-group editing↔submitted, scribe reassignment), Value presentation
(GoToNextValue walk), Final voting (open → closed → tie? → tiebreak loop →
winners), Final presentation (RevealNextValue staged reveal → concluded).
Every transition labeled `Command [actor] / Event`, guards noted (e.g.
"forward only", "all tied resolved").

**Success criteria:** every facilitator sub-control from SPEC.md is a
transition · no transition lacks actor + guard · only 0.1 command/event names
used (verbatim) · walk of all 9 phases against SPEC.md shows no dead ends.

**Slices:** 1) top-level 9-phase diagram + session lifecycle (Reconnect,
System commands on phase entry) · 2) sub-state diagrams phases 2–7 ·
3) sub-state diagrams phases 8–9 + guards table + SPEC walk-through check.

**Boundaries:** doc-only, no code · no technical vocabulary · deviations from
0.1 discovered here → update domain-model.md in same PR (Ask-first).
