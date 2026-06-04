# Event Results Phase 1 — pre-merge smoke-test checklist

Run through this on a real event before pushing to `master`. Tests prove the logic; this proves the wiring. Tick each box; if any **blocker** fails, fix before merging.

---

## 0. Setup — before you start

- [ ] Pick (or create) a **test event with imported scores**, ideally covering:
  - [ ] a discipline with **qualification only** (e.g. Prone)
  - [ ] a discipline that also has a **final** (Prone Final or 3P Final)
  - [ ] at least one **provisional** score (to test public hiding)
  - [ ] scores across more than one **category** (Open + one other)
- [ ] Have two browser contexts ready: **logged out** (incognito) and **admin**.

---

## 1. Firestore index (most likely production blocker)

- [ ] Load the event's Results section once on a deployed/staging build.
- [ ] If the section is empty or errors, open the **server logs / browser console** and look for a Firestore "create index" link for `eventId` + `discipline` (+ `deleted` / `status` if compound).
- [ ] **Create the composite index** from that link; wait for it to finish building (can take a few minutes).
- [ ] Reload — Results now populates.
- [ ] **Blocker:** do not push to `master` if `master` auto-deploys and the index isn't built — first load would error for members.

---

## 2. Single-fetch discipline discovery

- [ ] Open the event Results with the **network tab** open.
- [ ] Confirm **one** request to `/api/events/[id]/results` on load (not one per discipline).
- [ ] Pills shown match `availableDisciplines` — an event with only Prone scores shows **only the Prone pill**, not four.
- [ ] Initial board = `defaultDiscipline` (first available, or `prone_50m` fallback).
- [ ] Switching a pill fetches that discipline's board and updates the table + podium.

---

## 3. Finals-on-top (the logic tests can't fully prove visually)

On the event **with a final**:

- [ ] Podium top-3 shows the **finalists by `finalRank`**, NOT the qualification leaders (verify a shooter who won the final but wasn't top qualifier appears 1st).
- [ ] A separate **"Final"** block renders, ordered by `finalRank`.
- [ ] Qualifiers who didn't make the final appear **beneath** the finalists, in qualification order.
- [ ] Qualification + final totals are **never summed** anywhere on the page.

### 3P final specifics (if present)

- [ ] Each finalist row shows **total** + an **"out at shot N"** chip (or a medal indicator when `eliminatedAtShot` is null).
- [ ] Row **expand** shows the **35-shot ladder** (`ScoreDetailPanel`).
- [ ] Elimination order is correct: blank `eliminatedAtShot` ranks highest; ties broken by `decimalTotal`.

---

## 4. Provisional hidden on public (data, not just CSS)

- [ ] In **incognito (logged out)**, open the event Results.
- [ ] Provisional scores are **absent** — confirm in the **network response payload**, not just the rendered table (a row hidden only in the UI is a data leak).
- [ ] As **admin** with `includeProvisional`, the same provisional rows **are** present and tagged (greyed / "provisional" label).
- [ ] Provisional rows are **not** ranked into public placings (ranking computed after the filter).

---

## 5. Category filter

- [ ] Selecting a category (Open / Junior / Ladies / Veteran) filters the table and re-ranks within that category.
- [ ] Clearing the filter restores the full board.
- [ ] Podium reflects the active filter (or is clearly the overall podium — confirm intended behaviour either way).

---

## 6. Columns by discipline/stage

- [ ] Prone / F-Class / prone_final: `Place · Name · Club · Cat · S1–S6 · Total`.
- [ ] 3P qualification: `Place · Name · Club · Cat · Kneel · Prone · Stand · Total`.
- [ ] Expand panel shows the right breakdown (series for prone/fclass, positions for 3P qual, shot ladder for 3p_final).

---

## 7. Empty + edge states

- [ ] An event with **no official scores** shows the friendly "Results not published yet" empty state (not a broken/empty table).
- [ ] An event with scores in one discipline but not others: missing-discipline pills hidden; no errors.
- [ ] Logged-out view of an event whose **only** scores are provisional → shows empty state (since public filters them out).

---

## 8. Appearance & motion (the "appealing" requirement)

- [ ] Podium reads as a **podium** (1st centre/raised, gold/silver/bronze accents); stacks 1→2→3 on mobile.
- [ ] Row entrance animation is **subtle** (stagger/fade), totals count-up acceptable; no distracting motion.
- [ ] **`prefers-reduced-motion`**: enable it in OS/browser settings and confirm motion is disabled.
- [ ] **Responsive at 360px**: no horizontal scroll for core columns; S1–S6 / positions collapse into expand; pills wrap or scroll cleanly.
- [ ] Colours/spacing feel **native to the site** (Chakra theme tokens), not a bolted-on palette.

---

## 9. Deep-link & integration

- [ ] `/events/[id]#results` scrolls to the Results block.
- [ ] Results block sits **before registration** (as built) and doesn't break the rest of the event page.

---

## 10. Regression — don't let Phase 1 leak into the season board

- [ ] `/scores` season leaderboard is **unchanged** — still qualification-average only.
- [ ] **Final-stage docs do NOT appear** on `/scores` (only on the event results page).
- [ ] Event placing is **not** mixed into the season-average ranking.

---

## Push decision

- [ ] All **blockers** clear (index built; provisional truly filtered server-side; finals-on-top correct).
- [ ] Smoke-test passed in the two contexts (logged out + admin).
- [ ] If `master` auto-deploys: index is live **before** push.

→ If all ticked, safe to merge to `master`.
