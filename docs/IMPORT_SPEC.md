# SATRF Excel import spec

This document is the contract between **`SATRF_Match_Template.xlsx`** (the per-match upload file) and the website importer (`src/lib/excelImport.ts`). It defines every sheet the importer reads, the exact columns, their types, and how each row maps to a `ScoreInput`. Keep this file and the template in sync — if one changes, change both.

Place alongside the canonical template in `docs/`.

---

## General rules

- **One row = one shooter's result** for that sheet's discipline/stage.
- The importer reads **only the data columns listed per sheet**. `Total *`, `Final Rank`, `Rank`, `Check`, and `Notes` columns are **for the user's sanity check only** and must be **ignored** — the server recomputes all totals in `buildScore()`.
- Header row is **row 1** for qualification sheets, **row 3** for the two finals sheets. Data starts on the row after the header.
- A row is **skipped** (treated as blank) if `Shooter Name` is empty.
- Member linking is unchanged: match `Shooter Name` + `Club` against Firestore `users` to set `userId`; if no match, store the score with `userId: null` (guest).
- `source: 'excel'` on every imported row.
- All scoring is decimal; integer columns are optional ring totals.
- Dates are `YYYY-MM-DD` (Excel date cells acceptable; coerce to ISO string).

---

## Sheet → discipline / stage map

| Sheet name | discipline | stage | Shape |
|------------|-----------|-------|-------|
| `Prone 50m` | `prone_50m` | `qualification` | 6 series decimal (+opt integer) |
| `F-Class` | from **Discipline** column (`fclass_open` / `fclass_tr`) | `qualification` | 6 series decimal |
| `3-Position 50m` | `three_position_50m` | `qualification` | 3 positions, one total each (maps to 2 series/position) |
| `Prone Final` | `prone_50m` | `prone_final` | 6 series decimal (fresh 60) |
| `3P Final` | `three_position_50m` | `3p_final` | up to 35 per-shot decimals + elimination |

---

## 1. Sheet `Prone 50m`  → `prone_50m`, `qualification`

Header row 1. Data rows 2+.

| Col | Header | Maps to | Type | Required | Notes |
|-----|--------|---------|------|----------|-------|
| A | Date (YYYY-MM-DD) | `date` | date→ISO string | Yes | |
| B | Event Name | `eventName` | string | Yes | text label; event linking is by name on the site |
| C | Discipline | `discipline` | enum | Yes | must equal `prone_50m` |
| D | Shooter Name | `shooterName` | string | Yes | used for member link |
| E | Club | `club` | string | Yes | used for member link |
| F | Category | `category` | enum | Yes | `open`\|`junior`\|`veteran`\|`ladies` |
| G–L | S1 Dec … S6 Dec | `positions[0].series[n].decimal` | number | Yes (official) | 0–109.0 each |
| M–R | S1 Int … S6 Int | `positions[0].series[n].integer` | number | No | 0–100 each |
| S | Total Dec | — | — | **ignore** | server recomputes |
| T | Total Int | — | — | **ignore** | server recomputes |
| U | Status | `status` | enum | No | `official` (default) \| `provisional` |
| V | Notes | — | — | **ignore** | not imported |
| Y | Check | — | — | **ignore** | UI helper |

**Position block produced:**

```ts
positions: [{
  position: 'prone',
  series: [
    { seriesNumber: 1, decimal: G, integer?: M },
    ... up to seriesNumber 6 (L / R)
  ]
}]
```

Strict (official) requires all 6 decimal series present.

---

## 2. Sheet `F-Class`  → `fclass_open` | `fclass_tr`, `qualification`

Identical layout to `Prone 50m`. **Discipline comes from column C** (`fclass_open` or `fclass_tr`) — do not hard-code. Single position labelled `fclass`. 6 series, caps 109.0/series, 654.0/match.

Position block: `position: 'fclass'`, 6 series as above.

---

## 3. Sheet `3-Position 50m`  → `three_position_50m`, `qualification`

Header row 1. The template stores **one total per position** (not per-series), because the club shoots 20 shots/position.

| Col | Header | Maps to | Type | Required | Notes |
|-----|--------|---------|------|----------|-------|
| A | Date | `date` | date | Yes | |
| B | Event Name | `eventName` | string | Yes | |
| C | Discipline | `discipline` | enum | Yes | `three_position_50m` |
| D | Shooter Name | `shooterName` | string | Yes | |
| E | Club | `club` | string | Yes | |
| F | Category | `category` | enum | Yes | |
| G | Kneeling Dec | kneeling position decimal total | number | Yes | 0–218.0 |
| H | Prone Dec | prone position decimal total | number | Yes | 0–218.0 |
| I | Standing Dec | standing position decimal total | number | Yes | 0–218.0 |
| J | Kneeling Int | kneeling integer total | number | No | 0–200 |
| K | Prone Int | prone integer total | number | No | 0–200 |
| L | Standing Int | standing integer total | number | No | 0–200 |
| M | Total Dec | — | — | **ignore** | |
| N | Total Int | — | — | **ignore** | |
| O | Status | `status` | enum | No | |
| P | Notes | — | — | **ignore** | |
| S | Check | — | — | **ignore** | |

**Position blocks produced** (3 positions in fired order kneeling → prone → standing):

```ts
positions: [
  { position: 'kneeling', decimalTotal: G, integerTotal?: J },
  { position: 'prone',    decimalTotal: H, integerTotal?: K },
  { position: 'standing', decimalTotal: I, integerTotal?: L },
]
```

**Series mapping note:** the data model expects 2 series of 10 per position (per the website model decision). The template only carries the **position total**, not the two series. Two options for the importer:

- **(a) Preferred / simplest:** store the position total directly as `decimalTotal` for that position, and set `series` to a single aggregate entry (or empty) flagged as `aggregate: true`. Match `decimalTotal` = G+H+I.
- **(b)** If you require 2 series per position structurally, split the position total evenly is **not** acceptable (loses real data) — instead extend the template to carry 6 columns (K1,K2,P1,P2,S1,S2). Until then, use (a).

`decimalTotal` for the match = G + H + I (≤ 654.0). Strict mode requires all three position decimals present.

---

## 4. Sheet `Prone Final`  → `prone_50m`, `prone_final`

Header row 3. Data rows 4–11 (up to 8 finalists). A **fresh 60-shot match**, start from zero.

| Col | Header | Maps to | Type | Required | Notes |
|-----|--------|---------|------|----------|-------|
| A | Event Name | `eventName` | string | Yes | must match the qualification event so site can group them |
| B | Shooter | `shooterName` | string | Yes | |
| C–H | S1 … S6 | `positions[0].series[n].decimal` | number | Yes | 0–109.0 |
| I | Total | — | — | **ignore** | server recomputes |
| J | Final Rank | — | — | **ignore** | server recomputes from `decimalTotal` |
| K | Status | `status` | enum | No | |
| L | Notes | — | — | **ignore** | |

Produces a `prone_50m` doc with `stage: 'prone_final'`, single prone position, 6 series. `finalRank` computed server-side by `decimalTotal` desc among finalists for that event. **Club/Category** are not on this sheet — pull from the linked member, or leave to server to backfill from the shooter's qualification doc.

---

## 5. Sheet `3P Final`  → `three_position_50m`, `3p_final`  (per-shot)

Header row 3. Data rows 4–11. Full ISSF 35-shot ladder, decimal per shot.

| Col(s) | Header | Maps to | Type | Required | Notes |
|--------|--------|---------|------|----------|-------|
| A | Event Name | `eventName` | string | Yes | group with qualification |
| B | Shooter | `shooterName` | string | Yes | |
| C–L | K1…K10 | `finalShots[0..9]` (kneeling) | number | Yes | ≤10.9 each |
| M–V | P1…P10 | `finalShots[10..19]` (prone) | number | Yes | ≤10.9 each |
| W–AF | S1…S10 | `finalShots[20..29]` (standing 2×5) | number | Yes | ≤10.9 each |
| AG | After 30 | — | — | **ignore** | subtotal helper |
| AH–AL | x31…x35 | `finalShots[30..34]` (single standing) | number | No | ≤10.9; only filled until eliminated |
| AM | Total | — | — | **ignore** | server recomputes = sum(finalShots) |
| AN | Elim@Shot | `eliminatedAtShot` | number | No | 30–35; blank = fired all 35 (gold/silver) |
| AO | Rank | — | — | **ignore** | server recomputes `finalRank` |
| AP | Status | `status` | enum | No | |

**Produces:**

```ts
{
  discipline: 'three_position_50m',
  stage: '3p_final',
  shooterName: B,
  eventName: A,
  finalShots: [ ...C..AF (30), ...AH..AL present ones ],   // up to 35
  eliminatedAtShot: AN | null,
  decimalTotal: sum(finalShots),   // recomputed
  // finalRank computed: later eliminatedAtShot ranks higher; blank = highest; ties by decimalTotal
  source: 'excel',
  status: AP || 'official',
}
```

`finalRank` algorithm (server): treat blank `eliminatedAtShot` as ∞ (survived to last shot). Order by `eliminatedAtShot` desc, then `decimalTotal` desc. Rank 1 = winner.

---

## Validation summary (server, per `validateScoreInput`)

| Discipline / stage | Required cells (strict/official) | Per-unit cap | Match cap |
|--------------------|----------------------------------|--------------|-----------|
| `prone_50m` qual | 6 decimal series | 109.0/series | 654.0 |
| `fclass_*` qual | 6 decimal series | 109.0/series | 654.0 |
| `three_position_50m` qual | 3 position decimals | 218.0/position | 654.0 |
| `prone_final` | 6 decimal series | 109.0/series | 654.0 |
| `3p_final` | ≥30 shots (kneeling+prone+standing series) | 10.9/shot | n/a (elimination) |

`provisional` status relaxes the required-cell counts to warnings.

---

## Event grouping (important for finals)

For the per-event results view to place finalists on top of qualifiers, **qualification and final rows for the same match must share the same event**. Since the template uses a free-text `Event Name`, the importer should resolve `Event Name` (+ date) to a single `eventId` on the site (existing event dropdown / lookup), so qualification and final docs carry the same `eventId`. If no event match, create/select one in the admin UI at import time rather than relying on string equality alone.

---

## What the importer must NOT do

- Do not trust any `Total`, `Rank`, or `Check` column — recompute.
- Do not store per-shot data for qualification sheets (series/position totals only).
- Do not infer F-Class sub-discipline from the sheet name — read column C.
- Do not split a 3P position total into fake series.
