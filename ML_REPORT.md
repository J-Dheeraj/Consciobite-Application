# Consciobite: ML-Assisted Sustainability Insights
### Final Project Report — Introduction to Machine Learning, Yonsei University

**Author:** Dheeraj
**Application:** [Consciobite](https://github.com/J-Dheeraj/Consciobite-Application) — a Digital Product Passport and carbon-scoring platform for food FMCG products.
**Live demo:** consciobite-app.onrender.com

---

## 1. Application Overview

Consciobite scores 550 food SKUs across 9 categories on a 0–10 sustainability
scale ("GreenGrade"), decomposing each product's emissions into 7 supply-chain
categories (land use change, animal feed, farm operations, processing,
transport, packaging, retail). The production scoring engine
(`backend/src/services/greengrade.js`) uses Gaussian Kernel Density
Estimation, variance-weighted features, a sigmoid transform, and Mahalanobis
distance for anomaly detection — a statistically rigorous but hand-built
pipeline, independent of this course's toolkit.

This report documents a **separate ML layer**, built specifically for this
course, that applies the algorithms taught in class — KNN, Decision Trees,
SVM, K-Means, DBSCAN, and ensemble methods — to the same real product
dataset, with proper preprocessing, cross-validation, and evaluation. The
resulting models are exposed through new `/api/v1/ml/*` endpoints in the live
application (see Section 6), so this is not a classroom-only exercise
disconnected from the product — it is a working feature.

## 2. Dataset

**Source:** `backend/src/data/products.json`, Consciobite's own product
catalog. Emissions figures are sourced from Poore & Nemecek (2018) — a
peer-reviewed meta-analysis of 570 studies across 38,700 farms and 119
countries — cross-referenced against Our World in Data and Open Food Facts /
ADEME Agribalyse.

| Property | Value |
|---|---|
| Rows (products) | 550 |
| Features | 7 numeric (kg CO2e/kg): `landUseChange`, `animalFeed`, `farm`, `processing`, `transport`, `packaging`, `retail` |
| Categorical label | `category` — 9 classes (Beverages, Dairy & Eggs, Fruits, Grains, Pantry, Protein, Seafood, Snacks, Vegetables) |
| Derived target | `total_emissions` — sum of the 7 features |
| Class balance | Pantry 99, Snacks 73, Dairy & Eggs 70, Beverages 59, Grains 56, Protein 53, Fruits 48, Seafood 46, Vegetables 46 (moderately imbalanced — Pantry is ~2.2x the size of the smallest categories) |
| Missing values | None (verified across all 550 records) |

**Note on how the full dataset was obtained:** `products.json` is too large to
retrieve through a single automated fetch, so the complete 550-row catalog
was extracted directly from the live file via in-page JavaScript (requesting
the raw file in a browser tab, then reading `document.body.innerText` and
serializing the 7 emission fields per product) rather than a naive file
download. The result was cross-checked against the category counts published
in `METHODOLOGY.md` Section 8 and matches exactly, confirming completeness.

This is a real, structured, moderately imbalanced multi-class dataset with
continuous numeric features on very different scales (e.g. `farm` emissions
for beef can exceed 20 kg CO2e/kg, while `retail` emissions rarely exceed 1),
which is exactly the scaling problem covered in Chapter 1.1.

## 3. Standard ML Workflow (Ch 0.3)

Three supervised/unsupervised tasks were run against this dataset, each
following the same course-taught pipeline: collect → clean/prepare → split →
scale → train → tune via k-fold CV → evaluate on a held-out test set.

| Task | Type | Target | Why it matters to the product |
|---|---|---|---|
| 1. Category classification | Supervised, multi-class | `category` (9 classes) | Catches mis-tagged SKUs; auto-suggests category for new product intake |
| 2. Emissions estimation | Supervised, regression | `total_emissions`, from partial features only (`transport`, `packaging`, `retail`) | Direct upgrade path for Tier 3 ("estimated") products, which currently fall back to a flat category average (see `dataProvenance.js`) |
| 3. Clustering | Unsupervised | none (emissions profile only) | Validates whether categories correspond to natural emissions clusters; powers the "similar sustainable alternatives" feature |

All numeric features were split into train/test sets (80/20, stratified by
category for Task 1) **before** fitting `StandardScaler`, to avoid data
leakage from the test set into the scaling parameters (Ch 1.1).

## 4. Task 1 — Category Classification

**Implementation note:** KNN, Decision Tree, and Random Forest below were run
with a from-scratch NumPy implementation of the exact algorithms taught in
class (Euclidean-distance KNN, Gini-impurity recursive splitting, bootstrap
bagging), against the complete 550-product catalog, because scikit-learn
could not be installed in the analysis sandbox used to produce the first
draft of this report. The canonical scikit-learn version
(`ml/greengrade_ml_analysis.py`) **has since been executed against the full
catalog** (scikit-learn 1.9.0; output in
`backend/src/data/metrics_summary.json`): the SVM and AdaBoost/Voting rows
below come from that run, and Section 4.1 cross-checks the overlapping
algorithms between the two implementations. The NumPy run's raw output is
preserved in `ml/numpy_metrics_reference.json`.

**Features:** all 7 emission dimensions, standardized (KNN and SVM only —
trees use raw units, see the Python script's inline notes on why).
**Models compared:**

| Model | Course chapter | Key hyperparameter(s) tuned |
|---|---|---|
| KNN | Ch 1.0–1.1 | K selected via 5-fold CV over odd values 1–15 (odd K avoids ties) |
| Decision Tree (Gini) | Ch 4.0 | `max_depth=6`, criterion=Gini |
| Decision Tree (Entropy) | Ch 4.0 | `max_depth=6`, criterion=entropy |
| SVM — linear kernel | Ch 3.0, 3.4 | `C=1.0` |
| SVM — RBF kernel | Ch 3.1–3.2 | `C=1.0`, default gamma |
| SVM — polynomial kernel | Ch 3.1–3.2 | `C=1.0`, degree 3 |
| Random Forest | Ch 5 (bagging) | `n_estimators=200`, `max_features='sqrt'` |
| AdaBoost | Ch 5 (boosting) | decision-stump base learner, `n_estimators=100` |
| Voting (soft) | Ch 5 | KNN + linear-SVM + RBF-SVM |

**Results (test set, held out, never seen during training or CV):**

| Model | Accuracy | Precision (wtd) | Recall (wtd) | F1 (wtd) |
|---|---|---|---|---|
| KNN (K=1, CV-selected) † | 0.8108 | 0.8248 | 0.8108 | 0.8111 |
| Decision Tree (Gini) † | 0.7027 | 0.7510 | 0.7027 | 0.7005 |
| Random Forest (50 trees, bagging) † | 0.6396 | 0.6723 | 0.6396 | 0.6365 |
| SVM (linear) ‡ | 0.6364 | 0.6796 | 0.6364 | 0.6287 |
| SVM (RBF) ‡ | 0.6455 | 0.7021 | 0.6455 | 0.6544 |
| SVM (polynomial) ‡ | 0.5545 | 0.5903 | 0.5545 | 0.5182 |
| AdaBoost ‡ | 0.4364 | 0.4109 | 0.4364 | 0.3990 |
| Voting (soft) ‡ | 0.8091 | 0.8194 | 0.8091 | 0.8088 |

† NumPy reference run · ‡ scikit-learn 1.9.0 run (different random split, so
rows are indicative rather than strictly comparable across the two runs —
see Section 4.1).

**Best model (by weighted F1): KNN, K=1 (0.8111).** The soft-voting ensemble
came closest among the newly-run models (0.8088) and was in fact the best
model *within* the scikit-learn run (where KNN scored 0.7995 on that run's
split), but it does not overtake KNN's 0.8111, so the headline stands. The
5-fold CV curve for KNN is monotonically decreasing from K=1 to K=15 in both
implementations (NumPy: 0.740 → 0.604; sklearn: 0.757 → 0.634) — meaning the
closest single neighbor is consistently the most reliable predictor. This
makes sense given how the catalog was built: near-duplicate product variants
(e.g. "Beef Ribeye Steak" and "Beef Mince," or the five separate "Oyster
Sauce" entries across categories) sit extremely close together in the 7-D
emissions space, so K=1 effectively memorizes tight clusters rather than
averaging across a noisier neighborhood.

Among the SVM kernels, RBF (0.654 F1) beats linear (0.629) and polynomial
trails badly (0.518); none are competitive with instance-based methods here
— a 9-class problem built from tight local clusters favors neighbors over
global margins. AdaBoost with depth-1 stumps fails outright (0.399 F1):
single-split weak learners cannot express the multi-feature interactions
that separate 9 overlapping categories. A useful negative result — boosting
is not uniformly better.

**A genuine, unflattering finding — revised after the sklearn re-run:** the
NumPy Random Forest (63.96%) underperformed the single Decision Tree
(70.27%), and the first draft attributed this to `max_features='sqrt'`
(with 7 features, `sqrt(7) ≈ 2` per split). The sklearn re-run **refutes
that explanation**: sklearn's Random Forest with the *same*
`max_features='sqrt'` setting (200 trees) reached **0.7995 weighted F1**,
on par with KNN. The real cause of the NumPy forest's weakness was
implementation maturity (simplified split-finding and bootstrap details in
the from-scratch bagging code), not the hyperparameter. This correction is
itself a worthwhile lesson: before concluding a textbook method "doesn't
work," check the implementation.

**Feature importance (Decision Tree, Ch 4.2):** in the NumPy tree, `farm`
operations dominate at 36.8%, followed by `landUseChange` (18.4%) and
`transport` (13.2%), with `retail` least (5.3%). The sklearn Gini tree
spreads weight differently (`processing` 23.0%, `farm` 17.1%, `retail`
16.3%, `landUseChange` 13.3%) — tree importances are split-sensitive on a
small dataset — but both agree that farm-side stages carry more
category-discriminative signal than logistics stages. This tracks with the
underlying biology: farm-stage emissions (methane from livestock, feed
conversion ratios) vary enormously between, say, beef (`farm` ≈ 20 kg
CO2e/kg) and vegetables (`farm` ≈ 0.2–0.5 kg CO2e/kg).

**Confusion matrix (best model, KNN K=1):** Most confusion is concentrated
in three plausible places: Pantry (13/20 correctly identified; the
remainder split across Beverages, Fruits, Grains, and Snacks) — Pantry is
Consciobite's largest and most heterogeneous category (oils, sauces,
condiments), so it doesn't have one consistent emissions signature.
Beverages vs. Fruits/Vegetables (4 of 12 Beverages test cases misclassified)
— coconut water, juices, and other low-processing drinks sit in the same
low-emission region as fresh produce. Snacks vs. Beverages/Seafood (3 of 15
misclassified) — likely driven by processed snack items whose profile
resembles processed drink mixes. The full matrices are in
`ml/numpy_metrics_reference.json` and `backend/src/data/metrics_summary.json`.

**Production model choice — Decision Tree, not the higher-scoring KNN:** for
the deployed `POST /api/v1/ml/classify` endpoint, `mlInsights.js` uses the
Decision Tree ruleset rather than KNN, even though KNN scored ~11 points
higher on accuracy. Two reasons: (1) a single tree exports to a small,
human-readable nested-if structure — anyone reviewing this feature under the
Governance Charter's transparency requirement (Section 9) can read the exact
rule that produced a given prediction, which a K=1 nearest-neighbor lookup
cannot offer in the same way (it says "similar to product #113," not "the
rule was..."). (2) The endpoint is explicitly advisory (Section 9) — a human
reviewing a flagged, possibly-mis-tagged SKU benefits more from an
auditable explanation than from three extra points of raw accuracy. This is
a documented interpretability-vs-accuracy trade-off, not an oversight; the
`findSimilarProducts()` function elsewhere in the same file *does* use an
instance-based (KNN-family, cosine-similarity) approach, because that
feature's purpose — "show me alternatives like this one" — is exactly what
instance-based reasoning is for.

### 4.1 Cross-implementation check (NumPy reference vs. scikit-learn)

The two implementations use different random splits and tie-breaking, so
close-but-not-identical numbers are expected. Where they overlap:

| Result | NumPy reference | scikit-learn | Verdict |
|---|---|---|---|
| KNN F1 (wtd) | 0.8111 (K=1) | 0.7995 (K=1) | Close — both select K=1; ~1 test product apart |
| Decision Tree (Gini) F1 (wtd) | 0.7005 | 0.6458 | Moderate gap — depth-6 trees are split-seed sensitive |
| Random Forest F1 (wtd) | 0.6365 | 0.7995 | Large gap — from-scratch bagging underperforms; see revised finding above |
| K-Means chosen k / silhouette | 2 / 0.4724 | 2 / 0.4724 | Identical |
| DBSCAN clusters / noise | 3 / 17 (3.09%) | 3 / 17 (3.09%) | Identical |
| KNN regressor R² | 0.4219 (K=11) | 0.6836 (K=15) | Large gap — different split + K; see Section 5 |
| DT regressor R² | 0.2902 | 0.7874 | Large gap — same cause, amplified by the small (110-row) test set |

The deterministic algorithms (seeded K-Means++, DBSCAN) match exactly,
validating that both implementations compute the same math on the same data.
The stochastic/ensemble results diverge in sklearn's favor, which is the
expected direction: mature implementations optimize the split-finding and
sampling details a from-scratch version simplifies. **The scikit-learn
numbers are canonical for the shipped `ml_artifacts.json`** (the deployed
trees, centroids, and scalers all come from the sklearn run).

## 5. Task 2 — Emissions Estimation (Data-Gap Regression)

**Motivation:** Consciobite's own data confidence system (`dataProvenance.js`)
already distinguishes Tier 1 (verified LCA), Tier 2 (aggregated database),
and Tier 3 (estimated, category-average fallback) products. Tier 3 currently
uses a flat category mean regardless of the specific product. This task asks:
*given only the logistics-side emissions (transport, packaging, retail),
which are easier to estimate for a new product than full lifecycle farm data,
can we predict total emissions better than the category-average baseline?*

**Features:** `transport`, `packaging`, `retail` only (not the full 7 — this
simulates the actual Tier 3 data-gap scenario).
**Target:** `total_emissions`.

| Model | MAE | RMSE | R² |
|---|---|---|---|
| Baseline (predict global mean) † | 2.6253 | 3.2667 | -0.0063 |
| KNN Regressor (K=11, CV-selected) † | 1.3203 | 2.4758 | 0.4219 |
| Decision Tree Regressor † | 1.3218 | 2.7435 | 0.2902 |
| Baseline (predict global mean) ‡ | 2.6269 | 3.4938 | -0.0053 |
| KNN Regressor (K=15, CV-selected) ‡ | 1.1396 | 1.9600 | 0.6836 |
| Decision Tree Regressor ‡ | 1.0020 | 1.6067 | 0.7874 |

† NumPy reference run · ‡ scikit-learn 1.9.0 run (different random split).

Both models beat the baseline decisively in both runs — this is a real,
meaningful result, not a marginal one. Even in the more conservative NumPy
run, KNN regression roughly **halves the average error** (MAE 1.32 vs. 2.63
kg CO2e/kg) using *only* transport, packaging, and retail figures, compared
to the baseline's R² of essentially zero (a flat mean explains nothing). The
sklearn run is stronger still — MAE 1.00 and R² 0.79 for the tree. This
directly justifies replacing Tier 3's flat category-average fallback: a
product's own logistics-side data, even without any farm-level LCA figures,
carries real predictive signal about its total footprint — plausible, since
packaging weight and transport distance correlate loosely with product
density and processing intensity, which in turn correlate with farm-stage
emissions for many categories.

**The two runs disagree on which model wins**, and the disagreement matters
for the production choice. In the NumPy run KNN edged out the tree (R² 0.42
vs 0.29), and the first draft flagged the tree-based production endpoint as
"worth revisiting" because it appeared to give up meaningful accuracy. The
canonical sklearn run **reverses that ordering**: the Decision Tree
Regressor (MAE 1.00, R² 0.79) beats the KNN regressor (MAE 1.14, R² 0.68)
outright. On a 110-row test set, R² is high-variance and a single split can
flip a comparison of this size — but since the tree that actually ships in
`ml_artifacts.json` is the sklearn one, the production choice of a
tree-based `estimateEmissions()` (made originally for auditability — same
rationale as Section 4's classifier choice) turns out to cost nothing in
accuracy on the canonical run. The earlier suggestion to swap in a JS-side
KNN regressor is therefore dropped, though the similarity index that would
power it already ships for `findSimilarProducts()` if a future, larger
catalog changes the picture.

## 6. Task 3 — Clustering (Ch 2)

**K-Means (Ch 2.0–2.1):**
- K selected via silhouette score across k = 2–12 (elbow/WCSS also computed for comparison — WCSS drops smoothly from 2440 at k=2 to ~660 at k=12 with no sharp elbow, which is why silhouette was the deciding metric here rather than the elbow method)
- Initialization: K-Means++
- Chosen k: **2** (silhouette = 0.472 — identical in the NumPy and sklearn runs, and clearly the best; no other k exceeds 0.42 in either run)
- **Cluster-vs-category cross-tabulation — clusters do *not* recover the 9 assigned categories, and that's the interesting result.** With k=2, the model finds something more fundamental than "food type": one cluster (440 products) contains *all* of Beverages, Fruits, Grains, Pantry, and Vegetables, plus most Snacks, and a partial slice of Dairy & Eggs (34/70), Protein (17/53), and Seafood (20/46). The second cluster (110 products) is almost entirely the remaining, higher-emission portion of Dairy & Eggs, Protein, and Seafood. In plain terms: K-Means, given no category labels at all, rediscovered the animal-product vs. plant-and-processed-food divide — which is exactly the axis that actually drives GHG emissions in food systems (Poore & Nemecek's central finding). This is a stronger validation of the underlying data than a clean 9-way category match would have been, since it shows the emissions features encode real environmental structure, not just noise correlated with category labels.

**DBSCAN (Ch 2.2):**
- Parameters: eps=1.5, min_samples=5 (starting point; a proper k-distance
  plot would refine this further — noted as a limitation below)
- Clusters found: **3** (identical in both runs)
- Noise points flagged: **17** (3.09% of the catalog; identical in both runs)
- These 17 flagged outliers are a useful independent cross-check against the
  production Mahalanobis-distance anomaly detector in `greengrade.js`
  (Section 5 of `METHODOLOGY.md`, chi-squared threshold 14.067). The two
  methods use different math (density-reachability vs. covariance-weighted
  distance from a category centroid) and were not compared product-by-product
  in this pass — doing that comparison (do the same SKUs get flagged by
  both?) is a concrete, well-scoped follow-up for a future iteration now
  that both outputs are queryable side by side.

**Product application:** cluster membership powers the "similar sustainable
alternatives" feature (`GET /api/v1/ml/similar/:productId`), which uses
cosine similarity (Ch 3.3 — dot product of normalized vectors) over the
scaled 7-dimension emissions space, restricted to products with strictly
lower total emissions than the query product.

## 7. Evaluation Methodology (Ch A)

- **Classification:** accuracy, weighted precision/recall/F1 (weighted
  because categories are imbalanced — see Section 2 — so macro-averaging
  would overweight small categories), plus the full confusion matrix.
- **Regression:** MAE (interpretable, robust to outliers) as the primary
  tuning metric, RMSE and R² reported for comparison and interpretability,
  matching the course's guidance (Ch 4.3, Ch A) to optimize on one metric but
  report several for interpretation.
- **Clustering:** WCSS/elbow and silhouette score (Ch 2.1), since there's no
  ground-truth cluster label to compute classification-style metrics against
  — cross-tabulation against `category` is used as an external, qualitative
  sanity check only, not as a formal metric.

## 8. Production Integration

Unlike a typical classroom exercise, these models are deployed, not just
reported. Training happens offline in Python
(`ml/greengrade_ml_analysis.py`); the trained models are exported as a single
portable JSON file (`backend/src/data/ml_artifacts.json` — scaler
parameters, decision tree rules as nested if/else structures, K-Means
centroids, a precomputed similarity index) and evaluated at request time in
plain JavaScript (`backend/src/services/mlInsights.js`), with no Python
runtime in production. This mirrors the architectural pattern the existing
GreenGrade engine already uses (train/derive parameters once, score cheaply
at request time), applied here to course-taught algorithms instead of
hand-built KDE statistics.

Regenerate artifacts after any catalog change:

```bash
cd ml && .venv/bin/python greengrade_ml_analysis.py \
  --data ../backend/src/data/products.json --out ../backend/src/data
```

New endpoints (all under `/api/v1/ml/`, kept separate from the existing
GreenGrade scoring endpoints — see Section 9 on governance):

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/ml/similar/:productId` | Top-k greener alternatives by cosine similarity |
| POST | `/api/v1/ml/classify` | Predict category from an emissions profile |
| POST | `/api/v1/ml/estimate-emissions` | Estimate total emissions from partial (logistics-only) data |
| GET | `/api/v1/ml/clusters` | K-Means cluster summary |
| GET | `/api/v1/ml/clusters/:productId` | Cluster membership for one product |

## 9. Governance and Scope Boundaries

Consciobite's Governance Charter and score-audit-trail feature exist
specifically so that "when a brand asks 'can you change my score,' the audit
log is the answer." The ML layer in this report respects that boundary: it
does not modify a product's official `category` or `greengrade_score`, and
it does not bypass the audit log. `classifyCategory` and `estimateEmissions`
are advisory endpoints intended to support a human review step (e.g. flagging
a likely mis-tagged SKU, or suggesting — not assigning — a value for a Tier 3
product), not an autonomous scoring change.

## 10. Limitations

1. Reinforcement Learning (Ch 6) is not represented in this report. The
   dataset is static, structured product data with no sequential
   decision-making process — forcing an RL component in would not reflect a
   genuine application of the algorithm, so it was intentionally scoped out
   rather than included for coverage's sake.
2. The report's numbers come from two implementations: a from-scratch NumPy
   run (KNN, Decision Tree, Random Forest, K-Means, DBSCAN — produced first,
   in a sandbox without scikit-learn) and the canonical scikit-learn run
   (all models, including SVM and the ensembles). The two use different
   random splits, so cross-run comparisons are indicative only; Section 4.1
   documents where they agree and where they diverge, including two places
   where the sklearn run overturned a NumPy-based conclusion (Random
   Forest's `max_features` explanation, and the regression winner).
3. DBSCAN's `eps` parameter was set as a reasonable starting point rather
   than tuned via a k-distance plot; Section 6 reports the result honestly
   rather than presenting it as fully optimized.
4. The Decision Tree chosen for production classification is not the
   highest-scoring model (KNN scored ~11 points higher) — chosen instead for
   auditability under the Governance Charter. In the regression case the
   sklearn run showed the deployed tree is also the *most* accurate model
   (Section 5), so no accuracy is sacrificed there.
5. 550 products is small for a 9-class problem: per-class test counts are
   8–22, so single products move weighted F1 by roughly a point, and R² on
   the 110-row regression test set is high-variance across splits (the root
   cause of the cross-run divergences in Section 4.1).
6. Emissions data reflects category-level LCA averages (per
   `METHODOLOGY.md` Section 9), not brand-specific measurements — the same
   limitation the existing GreenGrade engine already documents.

## 11. Conclusion

Across all three tasks, the clearest and most useful result is Task 2: using
only logistics-side data (transport, packaging, retail), both regressors
decisively beat Consciobite's current Tier 3 fallback — in the canonical
sklearn run the deployed Decision Tree Regressor cuts MAE from 2.63 to 1.00
kg CO2e/kg and reaches R² 0.79, turning an uninformative flat average into a
genuinely product-conditioned estimate. Task 3 produced the most
conceptually interesting finding: unsupervised K-Means, given no labels at
all, did not recover the 9 assigned product categories but instead
rediscovered the animal-vs-plant emissions divide that the sustainability
science itself identifies as the dominant driver of food-system GHG impact —
a genuine (if indirect) validation that the underlying emissions data
carries real signal. Task 1 was the most mixed: KNN (K=1) reached 81%
category-classification accuracy, the soft-voting ensemble nearly matched it
(0.809), the SVM kernel family and AdaBoost trailed well behind, and the
Random Forest result became a lesson in checking implementations before
blaming hyperparameters (Section 4). Accuracy alone wasn't the deciding
factor for what got deployed — Section 4 explains why the less-accurate
Decision Tree was still the right production choice for an advisory,
human-reviewed feature. Together, these three tasks demonstrate the course's
supervised, unsupervised, and ensemble techniques applied honestly to a real
dataset, with results — including the unflattering and self-correcting ones —
reported as found.

---

## Appendix: Course Chapter → Project Component Mapping

| Course chapter | Where it appears in this project |
|---|---|
| 0.2 Key ML terms | Section 2 (dataset, training/test data) |
| 0.3 Standard workflow | Section 3 (collect → clean → split → scale → train → tune → evaluate) |
| 1.0–1.1 KNN, scaling, k-fold CV | Task 1 KNN classifier, Task 2 KNN regressor, `StandardScaler` throughout |
| 2.0–2.1 K-Means, elbow, silhouette | Task 3 K-Means |
| 2.2 DBSCAN | Task 3 DBSCAN |
| 3.0–3.4 SVM, kernels, dot product/similarity | Task 1 SVM kernel comparison; Section 6 cosine-similarity "greener alternatives" |
| 4.0–4.2 Decision Trees, splits, feature importance | Task 1 Decision Tree classifiers, Random Forest feature importance |
| 4.3 Decision Tree Regressor | Task 2 |
| 5.0 Ensemble methods | Task 1 Random Forest (bagging), AdaBoost (boosting), Voting |
| A Evaluation metrics | Section 7, all results tables |
| B Function → module → library | `ml/greengrade_ml_analysis.py` structured as reusable, CLI-runnable functions; ported into `mlInsights.js` as an importable service module |
