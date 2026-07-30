"""
GreenGrade ML Extension -- Final Project Analysis
====================================================
Course: Introduction to Machine Learning (Yonsei, Prof. 임웅)
Application: Consciobite (github.com/J-Dheeraj/Consciobite-Application)
Dataset: backend/src/data/products.json (550 food SKUs, 7 emission features, 9 categories)

WHAT THIS SCRIPT DOES
----------------------
The production app scores products with a hand-built KDE + Mahalanobis engine
(backend/src/services/greengrade.js). That engine is NOT built from this course's
toolkit. This script is the course-aligned ML layer: it runs the actual algorithms
taught in class against the same real product data, evaluates them properly, and
exports portable artifacts that a Node/JS service can consume at runtime without
needing a Python process in production.

Maps to course chapters:
  Ch 0.3  Standard ML workflow (collect -> clean -> split -> train -> tune -> evaluate)
  Ch 1    KNN (classification + regression), scaling, k-fold CV
  Ch 2    K-Means (elbow, silhouette, K-Means++) + DBSCAN
  Ch 3    SVM (linear vs. RBF vs. polynomial kernel comparison)
  Ch 4    Decision Trees (Gini vs. entropy, feature importance) + regressor
  Ch 5    Ensembles (Random Forest, AdaBoost, Voting)
  Ch A    Evaluation metrics (confusion matrix, P/R/F1, ROC-AUC, MAE/MSE/RMSE/R^2)
  Ch B    This file itself: function -> method -> module, CLI-runnable, importable

THREE TASKS ON THE SAME DATASET
--------------------------------
1. Category classification (9-class, supervised) -- can a model recover a
   product's category from its emissions profile alone? Useful in production
   for catching mis-tagged SKUs and auto-categorizing new ones.
2. Emissions estimation (regression) -- given only the "easy to measure" stages
   (transport, packaging, retail), estimate total emissions. This directly
   mirrors Consciobite's real "data confidence tier" problem: Tier 3 products
   have incomplete LCA data and currently fall back to a flat category average.
   A trained KNN/Decision-Tree regressor is a strictly better fallback.
3. Unsupervised clustering (K-Means + DBSCAN) -- do products naturally group by
   emissions profile, and how well does that match the assigned category? Cluster
   membership also powers a "greener alternatives in your cluster" feature.

USAGE
-----
    python greengrade_ml_analysis.py --data ../backend/src/data/products.json --out ./ml_out

Requires: pandas, numpy, scikit-learn (not matplotlib -- plots are optional/commented).
"""

import argparse
import json
import os
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold, KFold, GridSearchCV, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.svm import SVC
from sklearn.cluster import KMeans, DBSCAN
from sklearn.ensemble import RandomForestClassifier, AdaBoostClassifier, VotingClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, confusion_matrix,
    classification_report, silhouette_score, mean_absolute_error, mean_squared_error, r2_score,
)

EMISSION_KEYS = [
    "landUseChange", "animalFeed", "farm", "processing", "transport", "packaging", "retail",
]
# "Easy to measure" stages used for the data-gap regression task (Task 2).
# Rationale: transport/packaging/retail are logistics-side and easier to estimate
# from shipping + packaging specs than farm-level and land-use-change LCA data,
# which require full lifecycle assessments.
PARTIAL_KEYS = ["transport", "packaging", "retail"]

RANDOM_STATE = 42


# ---------------------------------------------------------------------------
# Ch 0.3 / Ch B: data loading as a standalone, reusable function
# ---------------------------------------------------------------------------
def load_data(path: str) -> pd.DataFrame:
    with open(path, "r", encoding="utf-8") as f:
        products = json.load(f)

    rows = []
    for p in products:
        emissions = p.get("emissions", {})
        row = {k: emissions.get(k, 0.0) for k in EMISSION_KEYS}
        row["category"] = p.get("category", "Unknown")
        row["product_id"] = p.get("id")
        row["name"] = p.get("name")
        row["total_emissions"] = sum(row[k] for k in EMISSION_KEYS)
        rows.append(row)

    df = pd.DataFrame(rows)
    df = df.dropna(subset=["category"])
    return df


def describe_dataset(df: pd.DataFrame) -> dict:
    return {
        "n_products": int(len(df)),
        "n_categories": int(df["category"].nunique()),
        "category_counts": df["category"].value_counts().to_dict(),
        "feature_summary": df[EMISSION_KEYS + ["total_emissions"]].describe().to_dict(),
    }


# ---------------------------------------------------------------------------
# Task 1 -- Ch 1, 3, 4, 5: category classification
# ---------------------------------------------------------------------------
def run_classification_task(df: pd.DataFrame) -> dict:
    X = df[EMISSION_KEYS].values
    y = df["category"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )

    # Ch 1.1: scale AFTER splitting -- fit only on training data to avoid leakage.
    # Distance-based models (KNN, SVM) need scaling -- Ch 1.1: "If one feature
    # has larger numbers, it can dominate the distance." Trees do NOT need
    # scaling: Gini/entropy splits are invariant to a monotonic per-feature
    # transform like StandardScaler, and fitting trees on RAW features keeps
    # their split thresholds in the same units as production emissions data,
    # which is required for the exported ruleset to be portable to JS
    # (mlInsights.js walks the tree against raw, unscaled emissions objects).
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    results = {}

    # --- KNN: pick K via 5-fold CV over odd values (Ch 1.0 sec 5 -- odd K avoids ties) ---
    # Uses SCALED features (distance-based).
    k_candidates = [k for k in range(1, min(16, len(X_train_s) // 2)) if k % 2 == 1]
    cv_scores = {}
    for k in k_candidates:
        knn = KNeighborsClassifier(n_neighbors=k)
        scores = cross_val_score(knn, X_train_s, y_train, cv=min(5, np.min(np.unique(y_train, return_counts=True)[1])))
        cv_scores[k] = float(scores.mean())
    best_k = max(cv_scores, key=cv_scores.get) if cv_scores else 3
    knn_best = KNeighborsClassifier(n_neighbors=best_k).fit(X_train_s, y_train)
    results["knn"] = evaluate_classifier(knn_best, X_test_s, y_test, extra={"best_k": best_k, "cv_scores_by_k": cv_scores})

    # --- Decision Tree: Gini vs. entropy (Ch 4.0) ---
    # Uses RAW features -- see note above. `dt` (Gini) is the one exported to
    # JS via export_decision_tree_rules(), so its thresholds must stay in raw
    # emission units (kg CO2e/kg), not standard-deviation units.
    for criterion in ["gini", "entropy"]:
        dt = DecisionTreeClassifier(criterion=criterion, max_depth=6, random_state=RANDOM_STATE)
        dt.fit(X_train, y_train)
        key = f"decision_tree_{criterion}"
        results[key] = evaluate_classifier(
            dt, X_test, y_test,
            extra={"feature_importances": dict(zip(EMISSION_KEYS, dt.feature_importances_.round(4).tolist()))},
        )
    # NOTE: after the loop, `dt` holds the entropy tree (last iteration).
    # Re-fit explicitly to guarantee the Gini tree is what gets exported,
    # regardless of loop order.
    dt = DecisionTreeClassifier(criterion="gini", max_depth=6, random_state=RANDOM_STATE).fit(X_train, y_train)

    # --- SVM: linear vs. RBF vs. polynomial kernel (Ch 3.0 - 3.4) ---
    # Uses SCALED features (distance/margin-based).
    for kernel in ["linear", "rbf", "poly"]:
        svc = SVC(kernel=kernel, C=1.0, probability=True, random_state=RANDOM_STATE)
        svc.fit(X_train_s, y_train)
        results[f"svm_{kernel}"] = evaluate_classifier(svc, X_test_s, y_test)

    # --- Ensembles (Ch 5) ---
    # Random Forest and AdaBoost are tree-based -> RAW features, same
    # reasoning as the standalone Decision Tree above.
    rf = RandomForestClassifier(n_estimators=200, max_features="sqrt", random_state=RANDOM_STATE)
    rf.fit(X_train, y_train)
    results["random_forest"] = evaluate_classifier(
        rf, X_test, y_test,
        extra={"feature_importances": dict(zip(EMISSION_KEYS, rf.feature_importances_.round(4).tolist()))},
    )

    ada = AdaBoostClassifier(
        estimator=DecisionTreeClassifier(max_depth=1), n_estimators=100, random_state=RANDOM_STATE
    )
    ada.fit(X_train, y_train)
    results["adaboost"] = evaluate_classifier(ada, X_test, y_test)

    # Voting mixes a distance-based model (KNN) with a margin-based model
    # (SVC) -- both need scaled input, so the whole ensemble runs on scaled
    # data. This voting ensemble is evaluation-only (not exported/ported to
    # JS), so the scaled-vs-raw distinction doesn't affect production.
    voting = VotingClassifier(
        estimators=[
            ("knn", KNeighborsClassifier(n_neighbors=best_k)),
            ("svc_rbf", SVC(kernel="rbf", probability=True, random_state=RANDOM_STATE)),
            ("svc_linear", SVC(kernel="linear", probability=True, random_state=RANDOM_STATE)),
        ],
        voting="soft",
    )
    voting.fit(X_train_s, y_train)
    results["voting"] = evaluate_classifier(voting, X_test_s, y_test)

    # Best model by weighted F1 -- the metric that matters most here since
    # categories are imbalanced (see describe_dataset category_counts).
    best_model_name = max(results, key=lambda k: results[k]["f1_weighted"])
    results["_best_model"] = best_model_name
    results["_scaler_mean"] = scaler.mean_.tolist()
    results["_scaler_scale"] = scaler.scale_.tolist()

    return results, {
        "rf_model": rf,
        "dt_model": dt,
        "knn_model": knn_best,
        "scaler": scaler,
    }


def evaluate_classifier(model, X_test, y_test, extra=None) -> dict:
    y_pred = model.predict(X_test)
    out = {
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision_weighted": round(float(precision_score(y_test, y_pred, average="weighted", zero_division=0)), 4),
        "recall_weighted": round(float(recall_score(y_test, y_pred, average="weighted", zero_division=0)), 4),
        "f1_weighted": round(float(f1_score(y_test, y_pred, average="weighted", zero_division=0)), 4),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
        "labels": sorted(list(set(y_test))),
    }
    if extra:
        out.update(extra)
    return out


# ---------------------------------------------------------------------------
# Task 2 -- Ch 1, 4.3, A: emissions estimation regression (data-gap fallback)
# ---------------------------------------------------------------------------
def run_regression_task(df: pd.DataFrame) -> dict:
    X = df[PARTIAL_KEYS].values
    y = df["total_emissions"].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=RANDOM_STATE)

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    results = {}

    # KNN regressor, CV over k
    k_candidates = [k for k in range(1, min(16, len(X_train_s) // 2)) if k % 2 == 1]
    cv_scores = {}
    for k in k_candidates:
        knn = KNeighborsRegressor(n_neighbors=k)
        scores = cross_val_score(knn, X_train_s, y_train, cv=5, scoring="neg_mean_absolute_error")
        cv_scores[k] = float(-scores.mean())
    best_k = min(cv_scores, key=cv_scores.get) if cv_scores else 3
    knn_reg = KNeighborsRegressor(n_neighbors=best_k).fit(X_train_s, y_train)
    results["knn_regressor"] = evaluate_regressor(knn_reg, X_test_s, y_test, extra={"best_k": best_k})

    # RAW features again -- same reasoning as Task 1: this tree is exported
    # via export_decision_tree_rules() and walked in JS against raw partial
    # emissions, so its thresholds must stay in raw kg CO2e/kg units.
    dt_reg = DecisionTreeRegressor(max_depth=5, random_state=RANDOM_STATE).fit(X_train, y_train)
    results["decision_tree_regressor"] = evaluate_regressor(
        dt_reg, X_test, y_test,
        extra={"feature_importances": dict(zip(PARTIAL_KEYS, dt_reg.feature_importances_.round(4).tolist()))},
    )

    baseline_pred = np.full_like(y_test, y_train.mean(), dtype=float)
    results["baseline_mean"] = {
        "mae": round(float(mean_absolute_error(y_test, baseline_pred)), 4),
        "rmse": round(float(np.sqrt(mean_squared_error(y_test, baseline_pred))), 4),
        "r2": round(float(r2_score(y_test, baseline_pred)), 4),
    }

    return results, {"knn_reg_model": knn_reg, "dt_reg_model": dt_reg, "scaler": scaler}


def evaluate_regressor(model, X_test, y_test, extra=None) -> dict:
    y_pred = model.predict(X_test)
    out = {
        "mae": round(float(mean_absolute_error(y_test, y_pred)), 4),
        "rmse": round(float(np.sqrt(mean_squared_error(y_test, y_pred))), 4),
        "r2": round(float(r2_score(y_test, y_pred)), 4),
    }
    if extra:
        out.update(extra)
    return out


# ---------------------------------------------------------------------------
# Task 3 -- Ch 2: clustering
# ---------------------------------------------------------------------------
def run_clustering_task(df: pd.DataFrame) -> dict:
    X = df[EMISSION_KEYS].values
    scaler = StandardScaler()
    X_s = scaler.fit_transform(X)

    # Elbow method: WCSS for k = 2..12
    wcss = {}
    silhouette = {}
    for k in range(2, min(13, len(X_s) - 1)):
        km = KMeans(n_clusters=k, init="k-means++", n_init=10, random_state=RANDOM_STATE)
        labels = km.fit_predict(X_s)
        wcss[k] = float(km.inertia_)
        silhouette[k] = float(silhouette_score(X_s, labels))

    best_k = max(silhouette, key=silhouette.get) if silhouette else 9
    km_final = KMeans(n_clusters=best_k, init="k-means++", n_init=10, random_state=RANDOM_STATE)
    cluster_labels = km_final.fit_predict(X_s)

    crosstab = pd.crosstab(df["category"], cluster_labels).to_dict()

    # DBSCAN -- default eps chosen conservatively; report should note this
    # typically needs a k-distance plot to tune properly (Ch 2.2 doesn't
    # prescribe an automatic eps selector, so this is a reasonable starting point).
    dbscan = DBSCAN(eps=1.5, min_samples=5)
    db_labels = dbscan.fit_predict(X_s)
    n_clusters_db = len(set(db_labels)) - (1 if -1 in db_labels else 0)
    n_noise = int(np.sum(db_labels == -1))

    return {
        "kmeans": {
            "wcss_by_k": wcss,
            "silhouette_by_k": silhouette,
            "chosen_k": best_k,
            "cluster_vs_category_crosstab": crosstab,
        },
        "dbscan": {
            "eps": 1.5,
            "min_samples": 5,
            "n_clusters_found": n_clusters_db,
            "n_noise_points": n_noise,
            "noise_pct": round(n_noise / len(X_s) * 100, 2),
        },
    }, {"kmeans_model": km_final, "scaler": scaler}


# ---------------------------------------------------------------------------
# Ch 3.3 + Ch 1: similarity-based "greener alternatives" (cosine similarity
# in scaled emission space, restricted to same category, lower total emissions)
# ---------------------------------------------------------------------------
def build_similarity_index(df: pd.DataFrame, scaler: StandardScaler) -> dict:
    X_s = scaler.transform(df[EMISSION_KEYS].values)
    norms = np.linalg.norm(X_s, axis=1, keepdims=True)
    norms[norms == 0] = 1e-9
    X_normed = X_s / norms  # unit vectors -> dot product == cosine similarity

    return {
        "product_ids": df["product_id"].tolist(),
        "categories": df["category"].tolist(),
        "total_emissions": df["total_emissions"].tolist(),
        "unit_vectors": X_normed.round(6).tolist(),
    }


# ---------------------------------------------------------------------------
# Ch B: portable artifact export (for JS runtime consumption -- no Python
# process needed in production, mirroring how greengrade.js already
# implements a trained-offline / run-in-JS pattern)
# ---------------------------------------------------------------------------
def export_decision_tree_rules(tree_model, feature_names, is_regressor=False) -> dict:
    """Recursively export an sklearn tree_ structure into nested-if JSON,
    portable to a plain JS function (no sklearn runtime needed). Works for
    both DecisionTreeClassifier and DecisionTreeRegressor."""
    tree_ = tree_model.tree_
    classes = None if is_regressor else tree_model.classes_.tolist()

    def recurse(node_id):
        if tree_.feature[node_id] == -2:  # leaf
            value = tree_.value[node_id][0]
            if is_regressor:
                return {"leaf": True, "prediction": round(float(value[0]), 6)}
            pred_idx = int(np.argmax(value))
            return {"leaf": True, "prediction": classes[pred_idx]}
        feature = feature_names[tree_.feature[node_id]]
        threshold = float(tree_.threshold[node_id])
        return {
            "leaf": False,
            "feature": feature,
            "threshold": round(threshold, 6),
            "left": recurse(tree_.children_left[node_id]),   # <= threshold
            "right": recurse(tree_.children_right[node_id]),  # > threshold
        }

    return recurse(0)


def export_artifacts(out_dir: Path, clf_models, reg_models, cluster_models, similarity_index, df):
    out_dir.mkdir(parents=True, exist_ok=True)

    # Cluster label + total_emissions per product, for "same cluster, greener
    # alternative" lookups and for the crosstab shown in the report.
    X_cluster_s = cluster_models["scaler"].transform(df[EMISSION_KEYS].values)
    cluster_labels = cluster_models["kmeans_model"].predict(X_cluster_s).tolist()

    artifacts = {
        "emission_keys": EMISSION_KEYS,
        "partial_keys": PARTIAL_KEYS,
        "classification_scaler": {
            "mean": clf_models["scaler"].mean_.tolist(),
            "scale": clf_models["scaler"].scale_.tolist(),
        },
        "decision_tree_rules": export_decision_tree_rules(clf_models["dt_model"], EMISSION_KEYS),
        "regression_scaler": {
            "mean": reg_models["scaler"].mean_.tolist(),
            "scale": reg_models["scaler"].scale_.tolist(),
        },
        "regression_tree_rules": export_decision_tree_rules(
            reg_models["dt_reg_model"], PARTIAL_KEYS, is_regressor=True
        ),
        "kmeans_centroids": cluster_models["kmeans_model"].cluster_centers_.round(6).tolist(),
        "kmeans_scaler": {
            "mean": cluster_models["scaler"].mean_.tolist(),
            "scale": cluster_models["scaler"].scale_.tolist(),
        },
        "product_cluster_labels": dict(zip(df["product_id"].tolist(), cluster_labels)),
        "similarity_index": similarity_index,
    }

    with open(out_dir / "ml_artifacts.json", "w") as f:
        json.dump(artifacts, f, indent=2)

    return out_dir / "ml_artifacts.json"


# ---------------------------------------------------------------------------
# CLI entrypoint
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="GreenGrade ML final-project analysis")
    parser.add_argument("--data", required=True, help="Path to backend/src/data/products.json")
    parser.add_argument("--out", default="./ml_out", help="Output directory for metrics + artifacts")
    args = parser.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"Loading dataset from {args.data} ...")
    df = load_data(args.data)
    print(f"Loaded {len(df)} products across {df['category'].nunique()} categories.")

    summary = {"dataset": describe_dataset(df)}

    print("Running Task 1: category classification ...")
    clf_results, clf_models = run_classification_task(df)
    summary["classification"] = clf_results

    print("Running Task 2: emissions estimation regression ...")
    reg_results, reg_models = run_regression_task(df)
    summary["regression"] = reg_results

    print("Running Task 3: clustering ...")
    cluster_results, cluster_models = run_clustering_task(df)
    summary["clustering"] = cluster_results

    print("Building similarity index ...")
    similarity_index = build_similarity_index(df, clf_models["scaler"])

    print("Exporting portable artifacts for JS runtime ...")
    artifact_path = export_artifacts(out_dir, clf_models, reg_models, cluster_models, similarity_index, df)

    with open(out_dir / "metrics_summary.json", "w") as f:
        json.dump(summary, f, indent=2, default=str)

    print(f"\nDone. Wrote:\n  {out_dir / 'metrics_summary.json'}\n  {artifact_path}")
    print(f"\nBest classifier by weighted F1: {clf_results['_best_model']}")


if __name__ == "__main__":
    main()
