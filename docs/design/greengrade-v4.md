# GreenGrade v4: design spec

**Status:** Draft, reviewed once (see section 12). No code in this change.
**Owner:** DHEERAJ
**Date:** 2026-11-28
**Replaces:** GreenGrade v3.0 (`backend/src/services/greengrade.js`, `METHODOLOGY.md`)

Confidence tags: **[Certain]** means checked in code or by running the model on the live catalog. **[Likely]** means a strong inference. **[Guessing]** means a judgment call that needs data we do not have yet.

---

## 1. Why v4

The uncomfortable part first: v3 is not a carbon score. It ranks each product against the current catalog, blends that with a rank inside its aisle, pushes the result through a sigmoid, and weights each emission stage by how much it *varies*. A brand or a journalist can break the result in one sentence.

- **[Certain]** Fresh Whole Milk (4.0 kg CO2e/kg) scores **5.9**. Oat Milk Barista (1.6 kg) scores **5.7**. Dairy milk wins because it is ranked against Dairy & Eggs while oat milk is ranked against Beverages. The same whole-milk emissions score 5.9 as Dairy, 5.5 as Protein and 2.0 as Beverages.
- **[Certain]** A product's score depends on what else is in the catalog. Adding 20 beef SKUs to Protein, without touching any existing product, flips the tier of **40** other products.
- **[Certain]** PR #61 showed what it costs to change scoring without a process. When product pages moved from the untrained fallback to real v3 output, the catalog average dropped from 9.25 to 5.07 and 449 of 550 products changed tier overnight.

v4 has two jobs. The score has to mean something fixed. And public scores should change only through a process that brands can see coming.

## 2. What v3 gets wrong

All numbers below come from running v3 (`trainModel` + `calculateGreenGrade`) over `backend/src/data/products.json` at main `301bd12`.

### 2.1 Scoring

| # | Problem | Evidence | Tag |
|---|---|---|---|
| S1 | Category blending (60% aisle, 40% global) makes scores incomparable across aisles | Milk example above | [Certain] |
| S2 | Scores are relative to the catalog, so they drift when products are added or removed | +20 beef SKUs: 40 tier flips. Dropping a random 10% and retraining: 2 flips, max delta 0.3 | [Certain] |
| S3 | Feature weights reward variance, not emissions | Animal Feed gets 27.7% of the weight but is 13.2% of catalog kg. Farm is 38.6% of kg but gets 20.2% of the weight | [Certain] |
| S4 | The final score only loosely follows total carbon | Spearman correlation between score and −total kg is 0.79 | [Certain] |
| S5 | Unknown categories silently fall back to global-only scoring | Whole milk under category "Frozen" scores 2.9 | [Certain] |
| S6 | A brand cannot reproduce its score in a spreadsheet | Per-stage sigmoid, then weighted sum, then rounding (`greengrade.js` ~L160-200) | [Certain] |

### 2.2 Missing data

| # | Problem | Evidence | Tag |
|---|---|---|---|
| M1 | A missing stage counts as 0 kg, the best possible value | `emissions[key] \|\| 0`. Firm Tofu with packaging and processing deleted goes from 8.4 to 8.5 | [Certain] |
| M2 | True zeros look the same as gaps | 178 zeros outside plant animal-feed, e.g. 109 `landUseChange: 0` and 11 `packaging: 0`. 61 products have a zero in a stage that is normally >10% of their aisle's footprint | [Certain] the zeros exist; [Likely] most packaging and many LUC zeros are gaps |
| M3 | Open Food Facts scans get emissions invented from the Eco-Score letter × a category baseline, and a missing Eco-Score silently becomes "c" | `estimateEmissions()` in `routes/products.js` | [Certain] |
| M4 | Those invented emissions are labelled tier 2 "aggregated database". Eco-Score also mixes in non-carbon factors, so turning it back into kg CO2e is circular | `computeDataConfidence()` | [Certain] label; [Likely] harm |

### 2.3 Data tiers and confidence

| # | Problem | Evidence | Tag |
|---|---|---|---|
| D1 | "Tier 1 verified LCA" is assigned by keyword match on the product name, not by evidence linked to the product | `findReference()`: 340 of 550 products are tier 1 | [Certain] |
| D2 | The keyword match is visibly wrong. "Oat Milk" matches `milk` and is checked against dairy milk. "Egg Tofu" matches `tofu`. Watermelon is tier 3 | Same function | [Certain] |
| D3 | `confidence` is category sample size / 30. It says nothing about this product's data | `calculateGreenGrade` | [Certain] |
| D4 | Scoring ignores the evidence registry (migration 007, `product_evidence_links`) | `routes/evidence.js` vs `dataProvenance.js` | [Certain] |

### 2.4 Tier boundaries

| # | Problem | Evidence | Tag |
|---|---|---|---|
| T1 | Hard cut-offs at 4.0 and 7.0 with no uncertainty. 88 products (16%) sit within 0.3 of a boundary | Catalog count | [Certain] |
| T2 | The cut-offs mean nothing in kg. "Green" means "beat most of the catalog", and that shifts as the catalog changes | Follows from S2 | [Certain] |

### 2.5 Explainability to brands

| # | Problem | Evidence | Tag |
|---|---|---|---|
| E1 | The breakdown shows a per-stage "score" and percentile, not what each stage contributes | `breakdown[]` shape | [Certain] |
| E2 | "Anomaly" flags high emitters, not bad data. Beef, coffee and chocolate are "anomalies", which reads as an accusation | 46 flagged, mostly high-carbon staples | [Certain] |
| E3 | Nothing tells a brand what would raise its score | No such API | [Certain] |

## 3. Goals and non-goals

### Goals

1. A product's headline score depends only on its own data and a published, versioned rule set. Adding products never moves anyone else's score.
2. A brand can recompute its own score and tier with a calculator from the published rules.
3. A product can never raise its score by withholding data (section 4.3 defines exactly what this guarantees).
4. The data tier reflects evidence actually linked to the product.
5. No public score changes without shadow scoring, a diff report and a brand notice period. This applies to every future version, not just v4 (section 7).
6. The label must not claim more than the data supports, since a coloured eco badge is an environmental claim under consumer-protection rules. [Likely] this applies in the EU and UK; check before launch in other markets.

### Non-goals for v4

- **Other impacts** (water, land, biodiversity). The catalog only holds carbon by stage. Adding them needs new data, not a new formula. [Certain]
- **Per-serving or per-protein functional units.** v4 stays per kg. This is the fairest complaint meat and dairy brands will raise, and v5 should discuss it. [Likely]
- **Brand primary-data intake tooling.** The submission flow from PR #45 can be reused. v4 only defines how such data changes the tier (section 4.5).

## 4. Proposed design

> Section 4.1 depends on the product decision put to the owner on 2026-11-28: what a score means to a shopper. This draft assumes the recommended option, **an absolute carbon headline with an aisle rank alongside it**. If the owner picks a different option, 4.1 and 4.7 change and the rest stands.

### 4.1 Headline score: fixed log scale on total kg CO2e per kg

```
raw   = 10 × (ln(HI) − ln(total)) / (ln(HI) − ln(LO))
score = clamp(0, 10, raw), displayed to one decimal
```

The anchors are `LO = 0.5 kg` (scores 10) and `HI = 30 kg` (scores 0).

- A log scale fits because 1 kg matters far more between 1 and 2 kg than between 30 and 31 kg. [Likely]
- The anchors are published constants, fixed for each methodology version and never learned from the catalog. This fixes S1, S2 and T2. [Certain]
- **The tier comes from total kg, not from the rounded score.** Low carbon is ≤ 1.71 kg, Medium is 1.71 to 5.83 kg, High is > 5.83 kg. These are the kg totals that map to scores 7.0 and 4.0. Deriving the tier straight from kg means a displayed score and its colour can never disagree. [Certain] On the current catalog, raw-score tiers and rounded-score tiers agree for all 550 products, but the rule has to be stated anyway.
- **Edge cases:**
  - When total ≤ LO, including total ≤ 0 (a negative land-use-change stage is allowed if it is evidenced), the score is 10.
  - When total ≥ HI, the score is 0.
  - Clamped products always show raw kg next to the score. Their improvement is shown in kg ("−40% kg vs reference"), because at the clamp a better product would otherwise look identical to a worse one.
- **Choosing the anchors:**
  - The working values are 0.5 and 30 kg. They roughly bracket the Poore & Nemecek medians, from root vegetables up to lamb, and leave beef at 0.
  - The final anchors must be justified in writing from the source data, not from the catalog impact. This draft has already shown that impact (table below), so whoever freezes the anchors has seen it. Until the advisory panel exists (charter §11), the owner records the justification in `METHODOLOGY.md`. The panel then ratifies or changes the anchors at its first methodology audit. [Guessing] on the exact values.

Impact on the current catalog, **before** the missing-data rules in 4.3 are applied. 4.3 adds about 61 "Insufficient data" products, so these figures understate the churn:

| Anchors (LO, HI) | Catalog average | Low / Medium / High | Tier changes vs v3 |
|---|---|---|---|
| v3 today | 5.07 | 98 / 300 / 152 | n/a |
| 0.5, 30 | 5.87 | 168 / 274 / 108 | 170 (142 up, 28 down) |
| 0.3, 50 | 5.69 | 116 / 338 / 96 | 152 |

Example products at (0.5, 30):

| Product | kg CO2e/kg | v3 | v4 |
|---|---|---|---|
| Oat Milk Barista | 1.6 | 5.7 | 7.2 |
| Fresh Whole Milk | 4.0 | 5.9 | 4.9 |
| Firm Tofu | 1.7 | 8.4 | 7.0 |
| Chicken Breast | 7.2 | 3.4 | 3.5 |
| Jasmine Rice | 4.4 | 3.2 | 4.7 |
| Arabica Coffee Beans | 12.1 | 1.7 | 2.2 |
| Beef Ribeye | 40.3 | 0.3 | 0.0 |

**[Likely]** for the two anchor pairs tested, v4 changes 150 to 170 tiers before missing-data rules. That cost comes with any score that means carbon, and section 7 exists to absorb it. Most moves are upgrades (fruit, vegetables, plant drinks). The 28 downgrades cluster in seafood, plant-based meat analogues and crackers.

### 4.2 Labels

- The tiers are renamed **Low carbon / Medium carbon / High carbon (per kg)**. "Green" and leaf icons are dropped, because v4 measures carbon only and "green" implies more than that. [Likely] this is needed to keep the label defensible. The brand name "GreenGrade" itself is the owner's call (section 10).
- Every badge shows the data tier next to it: "Measured", "Referenced" or "Estimated" (section 4.5).
- The score's colour still follows its tier. An estimate is never shown as a measured result: the word "Estimated" is on the badge, not hidden in a tooltip.

### 4.3 Missing data

This section has the most new rules, and the cold review found the most problems in it.

**Stage status.** Each of the seven stages carries one of three statuses: `measured`, `reported_zero` or `missing`.
- The status is stored per product and per stage in a new `stageStatus` field in `products.json` (section 5.1).
- A plant product may be `reported_zero` for `animalFeed`, but only per product, never per aisle. 37 products in plant aisles today have animal feed > 0 (for example snacks with milk), so an aisle rule would be wrong. [Certain]
- Every existing zero starts as `missing` until a person reviews it. That is phase 0 work (section 7).

**Materiality.** A stage is *material* for a product when its category reference profile (5.2) puts that stage at more than 10% of the category's typical total.

**Rules:**

| Situation | Result |
|---|---|
| Any **material** stage is missing | No score. Show "Insufficient data", list the missing stages, and invite the brand to supply them |
| Only non-material stages are missing | Fill each one with the reference **p90** for that stage and category. Widen the range by the filled kg only (4.4). Mark it "filled from category estimate" on the product page |
| Category has no reference profile | "Insufficient data". This closes S5 |
| Open Food Facts scan | No product score. Show "Typical for <category>: <tier>" built from the reference p50, clearly labelled as a category typical value, not this product's score. Nothing is stored in the snapshot table |

What goal 3 does and does not guarantee:
- Withholding a material stage always gives no score. There is no gain from hiding a large stage. [Certain]
- Withholding a non-material stage gains at most (true value − p90). By definition that is a stage under 10% of a typical total, and it only pays off for products above the 90th percentile in that stage. [Certain] that the gap is bounded; [Guessing] that 10% and p90 are the right cut-offs. The test in section 8 checks values *above* p90, not below.
- Scans are never scored better than catalog products with partial data, because scans get no product score at all.

### 4.4 Score range and "borderline"

- The range is built per stage with a multiplicative factor `f`. Each stage's kg spans from `kg ÷ f` to `kg × f`, so the band is symmetric on the log scale. The factor depends on that stage's evidence:

  | Stage evidence | f (placeholder) |
  |---|---|
  | Product-specific LCA/EPD | 1.15 |
  | Admin-linked reference product | 1.3 |
  | Filled from category p90 | 1.5 |

  `scoreLow` and `scoreHigh` are the scores at the summed upper and lower stage totals. [Guessing] on the factor values. They are placeholders until we have spread data from the sources.
- **Why per stage, not one % on the total:** applying a blanket ±50% to the total would put **356 of 550** products (65%) across a tier boundary. At ×1.3 the count is still 233, and at ×1.2 it is 149. [Certain] from a catalog run. A marker on two thirds of the catalog tells shoppers nothing.
- **Launch gate:** the borderline marker ships on badges only if, at phase 2, fewer than 25% of scored products are borderline. If more are, the range goes only into the API and the product detail page until better spread data narrows it.
- **No hysteresis.** v3's "stay in tier unless the score clears the boundary by 0.2" idea is dropped. It made the tier depend on edit history, which breaks goal 2. The range and the borderline marker deal with flicker. [Certain] it would have broken goal 2.

### 4.5 Data tiers

The data tier says how good the evidence is. It is separate from completeness, which 4.3 and 4.4 handle.

| Data tier | Badge word | Meaning |
|---|---|---|
| 1 | Measured | A product-specific LCA or EPD is linked to the SKU in `product_evidence_links` |
| 2 | Referenced | An admin has linked the SKU to a named reference product in a peer-reviewed dataset (e.g. Poore & Nemecek "milk"). The link needs a second admin's approval and is logged with its reason |
| 3 | Estimated | Neither of the above |

- Keyword matching may *suggest* a reference to an admin, but it can never assign a tier.
- A product with a tier 1 EPD and one filled non-material stage stays tier 1. Only the filled stage's factor in 4.4 widens.
- [Certain] On day one most of the catalog will be tier 3. Today 340 products claim "verified LCA" from keyword matches, and most of them will lose that label. This is the downgrade brands will mind most, so section 7 treats it as a change that requires notice.

### 4.6 Breakdown and what-if

- **Share of footprint** per stage, as kg and %, sorted largest first. For example: "Farm: 1.1 kg, 62% of footprint". The breakdown leaves out "points lost". The scale is logarithmic, so splitting points in proportion to kg misleads: removing a stage that is 50% of a 4 kg product gains 1.7 points, not the 2.55 a proportional split would show. [Certain]
- **What-if**, for each of the two largest stages separately: the score if that stage's kg fell by 10% with everything else unchanged, computed on the same kg the score uses (filled values included). For clamped products, show the kg change instead.
- Percentages are rounded with the largest-remainder method so they sum to 100.

### 4.7 Aisle rank

- This is a secondary label: "Lowest 15% kg in Plant & dairy milks (n = 24)". It is computed on kg, ties share the better rank, and it is frozen per snapshot.
- Products are ranked inside **comparison groups** defined in the reference table (5.2), not store aisles. That way oat milk and dairy milk sit in one group. [Likely] the groups need to be chosen by hand at first.
- It is shown only when the group has at least 10 scored products, and always next to the tier. It never appears alone.
- A SKU added mid-version is ranked against the frozen snapshot of the group. Existing ranks do not change until the next snapshot.
- Brand-quoting rule, published with the method: a brand may quote the rank only together with the tier and the methodology version.

### 4.8 What gets removed

- KDE scoring, the per-stage sigmoid, variance weights and the 60/40 blend.
- Public "anomaly" flags. Mahalanobis distance moves to an internal data-QA report for admins ("this stage mix is unusual for its group, check the data"). It never appears on product or passport pages.
- `confidence = sampleCount / 30`, replaced by the data tier and the range.
- The untrained fallback path. v4 needs no training, so there is no "before training" state for a route to hit by accident. That removes the root cause of PR #61. [Certain]

## 5. Data inputs

This was the biggest gap in the first draft. All of the following must exist before any scoring code is written.

### 5.1 `stageStatus` in `products.json`

```json
"stageStatus": { "landUseChange": "measured", "animalFeed": "reported_zero", "packaging": "missing", ... }
```

- Missing key or missing field means `missing`.
- Phase 0: one reviewer goes through all 178 non-feed zeros and every plant-aisle `animalFeed: 0`. Each one is classified with a short note. This is an estimated 1 to 2 days. [Guessing]

### 5.2 Reference table `backend/src/data/reference_profiles_v4.json`

Each comparison group gets one row:

```json
{
  "group": "plant_and_dairy_milks",
  "source": "Poore & Nemecek 2018, products: milk, soymilk, oat milk",
  "categories": ["Beverages", "Dairy & Eggs"],
  "stages": { "farm": { "p50": 0.0, "p90": 0.0, "shareOfTotal": 0.0 }, ... }
}
```

- Every product maps to exactly one group. A product with no group gets "Insufficient data".
- p50 and p90 per stage come from the source's distribution where it publishes one. Where it publishes only medians, p90 = 1.5 × median, and the substitution is recorded in the row's `source`. [Guessing] on 1.5.
- It is versioned with the methodology. Changing it is a version bump.
- Owner: DHEERAJ, or the academic panel member once appointed. Effort is about 3 to 5 days of research, and it is the critical path. [Likely]

### 5.3 Re-run before notice

Phase 2 recomputes every number in section 4.1 with 4.3 and 4.4 applied. The impact table in this doc is not final.

## 6. API and storage

### 6.1 Snapshots

- New table: `score_snapshots(product_id, methodology_version, score, score_low, score_high, tier, data_tier, status, inputs_hash, computed_at)`. Here `status` is `scored`, `insufficient_data` or `held`.
- **When they are written:** at boot, for any product whose `inputs_hash` (product emissions + stageStatus + linked evidence + reference row + version) differs from its latest row. Startup scores before the server accepts traffic, which is the v3 `trainModel` slot. The admin rescore endpoint does the same on demand.
- **Audit:** only rows whose score, tier or data tier changed go through the `scoreAudit` hash chain, so a deploy with no changes writes nothing.
- **Reads:** product, passport, compare, list, sort and carbon-summary endpoints all read the active version's snapshot and never compute on request. One source of truth also closes the product-vs-passport mismatch class from PR #61.
- **Phase 1 also freezes a `3.0` snapshot** of today's v3 output. Rollback needs it, and v3 cannot be recomputed reliably later because it is catalog-relative.

### 6.2 Response shape per phase

| Phase | `score` / `tier` mean | Extra fields |
|---|---|---|
| 1-3 | v3 (unchanged) | none public. Admin endpoints only |
| 4 dual display | **v4** | `previous: { methodologyVersion: "3.0", score, tier }` |
| 5 cutover | v4 | `previous` removed |

- New v4 fields: `methodologyVersion`, `status`, `scoreLow`, `scoreHigh`, `borderline`, `dataTier`, `stageStatus`, `footprintShare[]`, `whatIf[]`, `aisleRank`.
- When `status` is `insufficient_data`, `score` and `tier` are `null`. Sorting puts nulls last. Averages leave them out and report how many were excluded.
- v3 fields `breakdown[].categoryScore`, `breakdown[].percentile`, `anomaly` and `confidence` are kept through phase 4 and removed at phase 5. Partners hear about this in the phase 3 notice.
- Swagger is updated in the same PRs.

## 7. Rollout without another shock

| Phase | What happens | Exit criteria |
|---|---|---|
| 0. Data and rules | Build 5.1 and 5.2. Publish anchors, reference table, factors and labels in `METHODOLOGY.md` as "proposed v4.0" | Owner signs off. Panel ratifies later if not yet formed |
| 1. Shadow | Freeze the 3.0 snapshot. Compute `4.0-shadow` for every product. Admin-only `GET /api/admin/score-diff?from=3.0&to=4.0-shadow` | Snapshot complete, and the golden file (section 8) matches the diff endpoint |
| 2. Diff report | Per product: v3 → v4 score, tier, data tier, borderline, status, aisle rank, largest stage. Per group summary. Saved as a dated file and logged | Owner reviews it. Review may **only fix data errors**. Each fix is logged with a reason, upgrades get the same review, and the borderline launch gate (4.4) is checked |
| 3. Notice | **Every** brand whose score, tier, data tier, status or borderline flag changes gets its own rows, the method, and a list of its missing stages. The rule is the same for paying and non-paying brands. Contact attempts are logged. 30 days | 30 days pass. Every submitted evidence item is decided |
| 4. Dual display, staged | Week 1: upgrades and unchanged products go live. Downgrades and "Insufficient data" follow at the end of week 2 | See holds below |
| 5. Cutover | `4.0` becomes active and the v3 fields are dropped. The 3.0 snapshot is kept read-only | Live smoke checks the golden products |

**Holds.** A product stays on v3 with an "under review" note, rather than showing a v4 downgrade, if any of these is true:
- its brand could not be reached and no contact attempt is logged;
- evidence it submitted before go-live is not yet decided;
- it has an open score challenge.

Holds are listed in the admin diff and expire after 90 days. After that the v4 score publishes with a public note. [Guessing] on 90 days.

**Wording during dual display:** "Scoring method updated on <date>. The product itself has not changed." The previous score sits behind a "what changed" link, not next to the new number. That way "was 5.9, now 4.9" is never read as "this product got worse".

**Guardrails for every future change:**
- **Process rule.** Every methodology version bump runs phases 1 to 5, with the notice period written into the governance charter. A data edit that downgrades a product's tier gives its brand 14 days' notice before it publishes.
- **CI guard.** A test scores the base-branch inputs with both the base code and the head code. It fails if any product's score changes while its inputs are unchanged, unless the methodology version changed too. That catches a PR #61 class change without firing on legitimate catalog edits. [Certain] that it would have failed PR #61.
- **Rollback.** Switching the active version back to 3.0 is a config change, because both snapshots exist (target: under 10 minutes). After cutover, any rollback comes with a public note and a brand notice.
- **Paying-client firewall.** The diff report flags paying relationships, the evidence queue hides them from reviewers, and the full diff goes to the panel. The notice rule above is the same for everyone, so paying gives no early sight of scores.

## 8. Testing

- **Formula:** LO, HI, the clamp ends, total ≤ 0, and the two kg tier thresholds. Tier taken from kg for a product at 1.70, 1.71 and 1.72 kg. Monotonicity: more kg never raises the score.
- **Missing data:** a missing material stage gives `insufficient_data`. For a missing non-material stage, test with true values above p90 to show the gain is bounded as stated. A scan never gets a product score. An unmapped group gives `insufficient_data`.
- **Range:** the factor is applied per stage. `scoreLow ≤ score ≤ scoreHigh`. A tier 1 product with one filled stage keeps tier 1.
- **Independence:** the headline score is unaffected by adding or removing other products. Aisle rank changes only on a new snapshot.
- **Snapshots:** changed inputs trigger a rewrite. Unchanged inputs write nothing to the audit chain. Rollback serves the 3.0 rows.
- **API:** the response shape for each phase. `null` score handling in sort and averages. Product, passport and compare agree for every product.
- **Golden file:** expected v4 output for 20 hand-checked products. It runs in CI and in the live smoke test.

## 9. Effort (rough)

[Guessing] Expect 3 to 4 weeks of engineering plus about a week of research:
- Phase 0 data work: reference table 3 to 5 days, stage-status review 1 to 2 days.
- Formula, range, tiers and snapshots: 4 days.
- 3.0 freeze, diff endpoint and report: 2 days.
- API fields, Swagger, null handling: 2 days.
- Frontend badge, labels, breakdown, dual display, "under review": 4 days.
- Notice tooling (contact list, per-brand export, attempt log): 2 days.
- Tests and docs: 3 days.

The calendar is driven by the 30-day notice and the staged dual display, which add about 7 weeks after the code is done.

## 10. Open questions for the owner

1. What a score means to a shopper. This was asked on 2026-11-28; the draft assumes "absolute carbon headline with an aisle rank alongside".
2. Anchor values. 0.5 / 30 kg is the working default.
3. Whether to keep the "GreenGrade" name for a carbon-only score, or to say "carbon" in the product name.
4. The notice period. 30 days is proposed, and it should go into the charter.
5. Whether "Insufficient data" products drop down search results. The default is no, until their brands have had the phase 3 chance to supply data.

## 11. Alternatives considered

- **Keep v3 and just fix the weights.** Rejected. It leaves S1, S2 and T2, which are the score's meaning problems.
- **Absolute score with no aisle rank.** This is simpler and fully honest, but it leaves brands in high-carbon groups with nothing to compete on. It is still on the table through question 1.
- **Hysteresis on tiers.** Rejected (4.4).
- **Points lost per stage.** Rejected (4.6).

## 12. Review log

The first draft was reviewed cold by three fresh reviewers with no context: an LCA/statistics reviewer, a brand-and-regulator reviewer and an implementing engineer. All three independently re-derived the 4.1 arithmetic and found it correct. Changes made:

- **Missing data reworked.** In draft 1, withholding a high stage helped the product, and a scan with no data scored better than a product with partial data. Now: material gaps give "Insufficient data", other gaps are filled at p90, scans get no product score, and the data tier is separate from completeness (4.3, 4.5).
- **Range moved from a blanket % to per-stage factors.** With draft 1's ±50%, about 65% of products would have been "borderline". A launch gate was added (4.4).
- **Hysteresis dropped.** It contradicted goal 2 and the colour rule.
- **"Points lost" replaced** by share of footprint plus a per-stage what-if, because the log scale makes a proportional split misleading.
- **Tier taken from kg**, and edge cases for totals ≤ LO, ≤ 0 and ≥ HI defined.
- **Labels renamed** to Low/Medium/High carbon with the data tier on the badge, to avoid an unsupported "green" claim.
- **Notice widened** to every brand with any visible change, the same rule for paying and non-paying brands, holds for unreachable brands and open evidence or challenges, staged go-live, and neutral wording.
- **Aisle rank moved** to comparison groups, with a minimum n, always shown with the tier, and a quoting rule.
- **CI guard redesigned** so it does not fire on legitimate catalog edits.
- **Data inputs, snapshot lifecycle, per-phase API shape and null semantics added** (5, 6). Effort re-estimated from 2 weeks to 3 to 4 weeks plus research.

Not taken: one reviewer suggested showing no colour at all unless the whole range sits in one band. That would grey out most of the catalog on day one. The badge carries the data-tier word instead, and the borderline launch gate limits the damage. This is the call most worth a second look.
