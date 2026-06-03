# Cursor task: extend SATRF ISSF scoring to F-Class, 60-shot 3P, and Finals

You are working in the existing SATRF website (Next.js API routes + Firebase Admin, Firestore `scores` collection). The current implementation is described in `SCORING_WORKFLOW.md`. Do **not** rewrite the architecture. Keep the existing pipeline:

```
ScoreInput[] → POST /api/admin/scores (or /import) → validateScoreInput() → buildScore() → Firestore
```

Totals stay **server-computed**, never trusted from the client. Members still cannot self-insert. All four changes below extend this pipeline; they do not replace it.

---

## Change 1 — Add F-Class as a discipline

F-Class is structurally identical to prone: **1 position, 6 series × 10 shots = 60 shots, decimal, series cap 109.0, match cap 654.0.** It has two sub-disciplines that rank separately: `fclass_open` and `fclass_tr`.

**Edits:**

- `src/types/scores.ts` — extend the `discipline` union to:
  `'prone_50m' | 'three_position_50m' | 'fclass_open' | 'fclass_tr'`
- `src/lib/issf.ts` — add rule entries for `fclass_open` and `fclass_tr`. Each: positions `['fclass']` (single position label), 6 series, 60 shots, max decimal/series `109.0`, max match decimal `654.0`. Reuse the prone validation/total path; only the position label and discipline key differ.
- `src/pages/api/leaderboard/overall.ts` — the `discipline` param already drives filtering; just ensure the new keys are accepted and that `fclass_open`/`fclass_tr` are ranked as separate boards (they already will be if filtering is by exact discipline string).
- Excel/CSV import (Change 4) must accept these discipline values.

**Ranking:** unchanged — average of `decimalTotal` across official scores, per discipline.

---

## Change 2 — Fix 3P to 60 shots (20 per position)

The current model has `three_position_50m` as 4 series × 40 = 120 shots, max match 1308.0. The club actually shoots **20 shots per position = 60 total**, structured as **3 positions × 2 series of 10 shots** (kneeling → prone → standing), exactly like prone's series shape.

**New 3P spec in `src/lib/issf.ts`:**

| Property | Value |
|----------|-------|
| Positions | `['kneeling','prone','standing']` (fired in that order) |
| Series per position | 2 (each 10 shots) |
| Shots | 60 |
| Max decimal per series | 109.0 |
| Max decimal per position | 218.0 |
| Max match decimal | 654.0 |
| Max integer per position | 200 |

**Edits:**

- `src/lib/issf.ts` — replace the `three_position_50m` rule with the above. Strict (official) validation must require **2 series per position across all 3 positions** = 6 series total.
- `validateScoreInput()` — for 3P, validate per-position series counts (2 each), not a flat series count.
- `buildScore()` — `decimalTotal` = sum of all 6 series; `integerTotal` = sum of integers; per-position totals = sum of that position's 2 series.
- Update any UI labels / `ManualEntryComponent.tsx` that assume 4×40.

---

## Change 3 — Add Finals as a separate scored stage

Today the model has no concept of a final. Add a `stage` field and rank finals separately. **Qualification and final are never averaged together** (ISSF: finalists ranked by final result on top, everyone else by qualification beneath).

### 3.1 Data model (`src/types/scores.ts`)

Add to the score document:

```ts
stage: 'qualification' | 'prone_final' | '3p_final';   // default 'qualification'
finalRank?: number;        // 1..n, only on final-stage docs
finalShots?: number[];     // per-shot decimals, only for 3p_final
eliminatedAtShot?: number; // 30..35 for 3p_final; null/undefined = reached last shot
```

Existing docs without `stage` are treated as `qualification` (backfill or default in `buildScore`).

### 3.2 Prone Final & F-Class final (if run)

A **fresh 60-shot match** (6 series × 10), start from zero, scored exactly like qualification. Same `positions[]`/`series` shape. `stage = 'prone_final'`. Ranked by `decimalTotal` of that final doc only.

### 3.3 3P Final — full ISSF 35-shot ladder (store per-shot)

Per the 2026 ISSF rulebook:

- 10 match shots **kneeling** + 10 match shots **prone** (fired in that order, 22 min total)
- then **2 × 5-shot series standing** (250s each) → 30 shots; **two lowest eliminated**
- then **single standing shots** (50s each): after each, the lowest is eliminated, until 2 remain for the last shot → **35 shots total**
- Elimination ladder: after shot 30 → 8th & 7th out; shot 31 → 6th; 32 → 5th; 33 → 4th; 34 → bronze (3rd); 35 → gold/silver.

Store:

- `finalShots[]` — array of up to 35 decimals (kneeling[10], prone[10], standing series[10], singles[≤5])
- `decimalTotal` — sum of `finalShots`
- `eliminatedAtShot` — 30..35, or null if the shooter fired all 35
- `finalRank` — computed: later elimination ranks higher; ties broken by `decimalTotal`.

**Server validation:** each shot ≤ 10.9. `3p_final` requires `discipline === 'three_position_50m'`.

### 3.4 Ranking with finals (`overall.ts` or a new endpoint)

For a given match/event + discipline:

1. Take all `official`, non-deleted qualification docs → order by `decimalTotal` desc = qualification ranking.
2. If final docs exist for that event+discipline: order finalists by `finalRank` (1 = best) and place them **on top**; non-finalists keep qualification order **beneath** the finalists.
3. Never sum or average qualification + final together. The leaderboard "average" metric stays a **qualification-only** statistic; finals decide *placing for that event*, surfaced as a separate event result.

> Recommended: keep the existing average-based leaderboard as the season/aggregate board (qualification only), and add a **per-event result** view that applies the ISSF finalists-on-top rule. This avoids breaking the current leaderboard semantics.

---

## Change 4 — Extend Excel/CSV import beyond prone

Currently `src/lib/excelImport.ts` parses the `Prone Scores` sheet only. Extend it to read the multi-sheet workbook (the SATRF score-import Excel) and map each sheet to `ScoreInput[]`:

| Sheet | discipline | stage | Shape |
|-------|-----------|-------|-------|
| `Prone 50m` | `prone_50m` | qualification | 6 series decimal (+ optional integer) |
| `F-Class` | `fclass_open` / `fclass_tr` (from Discipline column) | qualification | 6 series decimal |
| `3-Position 50m` | `three_position_50m` | qualification | per-position totals → map to 2 series each, OR accept per-position totals as the position total |
| `Prone Final` | `prone_50m` | prone_final | 6 series decimal |
| `3P Final` | `three_position_50m` | 3p_final | per-shot array + eliminatedAtShot |

**Import rules:**

- Discipline read from the sheet's Discipline column where present (F-Class), else implied by sheet.
- Member auto-link unchanged: `shooterName` + `club` against `users` → `userId`.
- `source: 'excel'`.
- Server still recomputes all totals; the Excel's own `Total` columns are ignored on import (they exist only for the user's sanity check).
- 3P qualification: the Excel stores one decimal + one integer per position. Map each position total into the position block; if the importer needs series granularity, split the position total into its 2 series only if the sheet provides them, otherwise store as a single position total and mark series as aggregate.

**Preview step unchanged:** show valid/error rows before commit.

---

## Constraints & non-goals

- Do not change Firestore security rules (admin-only writes stay).
- Do not store per-shot for prone/F-Class/3P **qualification** — series totals only (matches today). Per-shot is **only** for the 3P final.
- Keep `provisional` vs `official` behaviour (provisional allows incomplete series; only official counts for rankings).
- Memory/cost: each score doc is a few KB (series totals); the 3P final adds ~35 numbers (~300 bytes). No storage concern at any realistic club volume.

## Acceptance checks

1. F-Class Open and TR appear as separate leaderboards; a 6-series F-Class score saves and ranks.
2. A 3P qualification score with 3 positions × 2 series saves; `decimalTotal` ≤ 654.0; strict mode rejects missing series.
3. A Prone Final (fresh 60) saves as `stage: prone_final` and does **not** alter the qualification average leaderboard.
4. A 3P Final saves 35 `finalShots`, computes `finalRank` by elimination order, and the per-event result view shows finalists on top.
5. Importing the multi-sheet Excel creates the correct `ScoreInput[]` per sheet with server-recomputed totals.
