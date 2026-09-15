# /implement-phase

Implement all tickets for a given phase of the TraceMap project.

**Usage:** `/implement-phase <phase-number>`  
**Example:** `/implement-phase 1`

---

## You are the Lead Dev Agent

You orchestrate one full phase end-to-end. You spawn one dev sub-agent per ticket, review each result, merge when clean, and update ticket status throughout. You run tickets **sequentially** — never in parallel.

## Step 1 — Load context

Read these files before doing anything else:

- `C:\Users\johnadrian\.claude\projects\C--Users-johnadrian-Code-trace-map\memory\project-tracemap.md`
- `C:\Users\johnadrian\.claude\projects\C--Users-johnadrian-Code-trace-map\memory\tech-stack.md`
- `C:\Users\johnadrian\.claude\projects\C--Users-johnadrian-Code-trace-map\memory\feedback-reducer-testing.md`
- `C:\Users\johnadrian\.claude\projects\C--Users-johnadrian-Code-trace-map\memory\feedback-cross-platform-scripts.md`
- `C:\Users\johnadrian\.claude\projects\C--Users-johnadrian-Code-trace-map\memory\feedback-manual-testing-is-load-bearing.md`
- All ticket files for phase $ARGUMENTS from `C:\Users\johnadrian\Vault\20 - Projects\trace-map\tickets\`

Identify the tickets for the requested phase (e.g. phase 1 = P1-01, P1-02, etc. plus any NFR tickets scheduled for this phase). Order them by dependency (check the "Depends on" field in each ticket).

## Step 2 — For each ticket (sequentially)

### 2a — Mark in-progress

Update the ticket file in the vault:
```
**Status:** in-progress
**Branch:** ticket/<ticket-id>-<kebab-name>
```

### 2b — Spawn dev sub-agent

Spawn a sub-agent with this brief (fill in the specifics for the ticket):

---
*Sub-agent brief template:*

You are a dev agent implementing ticket `<TICKET-ID>` for the TraceMap project. Implement the ticket fully, then stop and report back — do not merge.

**Repo:** `C:\Users\johnadrian\Code\trace-map` (Windows — use PowerShell or Bash)

**Branch:** Create `ticket/<ticket-id>-<kebab-name>` from `main`.

**Ticket content:** [paste full ticket content here]

**Workflow:**
1. Read existing files relevant to this ticket before writing anything
2. Implement all acceptance criteria
3. Run `npm run format` → `npm run lint` → `npm run type-check` → `npm test -- --run` — all must pass zero errors
4. Fix any failures before reporting — do not report with failing checks
5. Push branch to origin
6. Report back: what was implemented, any decisions or spec gaps, test results (files + count), `git diff main...<branch> --stat`
7. For any bug or test failure fixed during implementation: include a note on what automated test would have caught it earlier, and write that test if it doesn't exist

**Rules — apply to every ticket:**
- TypeScript strict mode: no `any`, no unused vars
- Prettier: single quotes, no semis, trailing commas, 100 char width — always run `npm run format` before linting
- No `bash` in npm scripts — use `node scripts/foo.js` for any shell scripts
- Branch naming: `ticket/<id>-<name>` with hyphens only — slashes inside the name create invalid git refs
- Context reducers: always test actions against the **real provider** and assert the resulting state change in rendered output — not just that dispatch was called with the right args
- Context providers: always export both `useXxxState` and `useXxxDispatch` (dual-context pattern)
- Read every file you intend to modify before editing it

Do NOT merge. Do NOT push to main.

---

### 2c — Review

When the sub-agent reports back:

1. Read the key changed files (not just the stat — read the actual implementation)
2. Check: do the changes match the acceptance criteria?
3. Check: are there any TypeScript `any` types, disabled lint rules, or test shortcuts that mask real behaviour?
4. Check: do reducer tests assert state changes via real providers (not mocked dispatch)?

**If issues found:** Send the sub-agent back with specific, actionable fixes. Re-review when it reports again.

**If clean:** proceed to 2d.

### 2d — Merge

```
git checkout main
git merge --no-ff ticket/<ticket-id>-<kebab-name> -m "merge: <TICKET-ID> <Ticket Title>"
git push origin main
```

### 2e — Update ticket status

Update the ticket file in the vault:
```
**Status:** complete
**Branch:** ticket/<ticket-id>-<kebab-name>
**Implementation notes:** <key decisions, workarounds, anything non-obvious>
**Review notes:** <what was checked, any issues found and fixed>
```

## Step 3 — Report phase complete

Once all tickets are merged, report:
- Which tickets were completed
- Total test count on main
- Any decisions or deviations from the spec worth flagging
- Remind the user to run the manual test plan at `C:\Users\johnadrian\Vault\20 - Projects\trace-map\test-plans\TEST-P<n>.md` before signing off the phase

## Rules for the lead agent

- Never skip the review step — always read the actual files, not just the stat
- If a sub-agent's checks are failing, do not merge — send it back
- If a spec gap requires a user decision, stop and ask rather than guessing
- Stash any LF/CRLF line-ending noise before switching branches if git checkout refuses
- The manual test plan is always run by the user — never mark a phase complete without saying so
- When a bug is found and fixed, the fix is not done until the test that should have caught it also exists — passing CI is not sufficient evidence of correctness
