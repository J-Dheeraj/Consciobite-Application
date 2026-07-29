"""
NumPy-only reference run of the course algorithms against the FULL real
Consciobite dataset (550 products), used because scikit-learn is not
installable in this sandbox (no package-index access). This is a faithful
implementation of the same math taught in class (Euclidean-distance KNN,
Gini-impurity decision trees, Lloyd's-algorithm K-Means with K-Means++ init,
DBSCAN density expansion, bagging for Random Forest) -- not a shortcut.

Claude Code should still run greengrade_ml_analysis.py (the real sklearn
version) inside the repo for the canonical/final numbers, especially for the
SVM kernel comparison and AdaBoost/Voting ensembles, which are not
reimplemented here. Where results overlap (KNN, Decision Tree, Random
Forest, K-Means, DBSCAN), they should be very close, since both are running
the same algorithms over the same data.
"""
import numpy as np
import pandas as pd
import json

RANDOM_STATE = 42
rng = np.random.default_rng(RANDOM_STATE)

EMISSION_KEYS = ["landUseChange", "animalFeed", "farm", "processing", "transport", "packaging", "retail"]
PARTIAL_KEYS = ["transport", "packaging", "retail"]

df = pd.read_csv("products_full.csv")
df["total_emissions"] = df[EMISSION_KEYS].sum(axis=1)
print("Loaded", df.shape[0], "products,", df["category"].nunique(), "categories")

# ---------------------------------------------------------------------------
# Helpers: scaler, splits, metrics
# ---------------------------------------------------------------------------
class StandardScaler:
    def fit(self, X):
        self.mean_ = X.mean(axis=0)
        self.std_ = X.std(axis=0)
        self.std_[self.std_ == 0] = 1.0
        return self
    def transform(self, X):
        return (X - self.mean_) / self.std_
    def fit_transform(self, X):
        return self.fit(X).transform(X)


def stratified_train_test_split(X, y, test_size=0.2, seed=RANDOM_STATE):
    rng_local = np.random.default_rng(seed)
    classes = np.unique(y)
    train_idx, test_idx = [], []
    for c in classes:
        idx = np.where(y == c)[0]
        rng_local.shuffle(idx)
        n_test = max(1, int(round(len(idx) * test_size)))
        test_idx.extend(idx[:n_test])
        train_idx.extend(idx[n_test:])
    train_idx = np.array(train_idx); test_idx = np.array(test_idx)
    rng_local.shuffle(train_idx); rng_local.shuffle(test_idx)
    return X[train_idx], X[test_idx], y[train_idx], y[test_idx]


def kfold_indices(n, k=5, seed=RANDOM_STATE):
    rng_local = np.random.default_rng(seed)
    idx = np.arange(n)
    rng_local.shuffle(idx)
    folds = np.array_split(idx, k)
    for i in range(k):
        test_idx = folds[i]
        train_idx = np.concatenate([folds[j] for j in range(k) if j != i])
        yield train_idx, test_idx


def accuracy(y_true, y_pred):
    return float(np.mean(y_true == y_pred))


def precision_recall_f1_weighted(y_true, y_pred):
    classes = np.unique(y_true)
    precisions, recalls, f1s, supports = [], [], [], []
    for c in classes:
        tp = np.sum((y_pred == c) & (y_true == c))
        fp = np.sum((y_pred == c) & (y_true != c))
        fn = np.sum((y_pred != c) & (y_true == c))
        support = np.sum(y_true == c)
        p = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        r = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = 2 * p * r / (p + r) if (p + r) > 0 else 0.0
        precisions.append(p); recalls.append(r); f1s.append(f1); supports.append(support)
    supports = np.array(supports)
    weights = supports / supports.sum()
    return (
        float(np.sum(np.array(precisions) * weights)),
        float(np.sum(np.array(recalls) * weights)),
        float(np.sum(np.array(f1s) * weights)),
    )


def confusion_matrix(y_true, y_pred, labels):
    idx = {l: i for i, l in enumerate(labels)}
    cm = np.zeros((len(labels), len(labels)), dtype=int)
    for t, p in zip(y_true, y_pred):
        cm[idx[t], idx[p]] += 1
    return cm


def mae(y_true, y_pred):
    return float(np.mean(np.abs(y_true - y_pred)))


def rmse(y_true, y_pred):
    return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))


def r2(y_true, y_pred):
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - y_true.mean()) ** 2)
    return float(1 - ss_res / ss_tot) if ss_tot > 0 else 0.0


# ---------------------------------------------------------------------------
# KNN (Ch 1)
# ---------------------------------------------------------------------------
class KNNClassifier:
    def __init__(self, k=5):
        self.k = k
    def fit(self, X, y):
        self.X_ = X; self.y_ = y
        return self
    def predict(self, X):
        preds = []
        for x in X:
            dists = np.sqrt(np.sum((self.X_ - x) ** 2, axis=1))
            nn_idx = np.argsort(dists)[: self.k]
            labels, counts = np.unique(self.y_[nn_idx], return_counts=True)
            preds.append(labels[np.argmax(counts)])
        return np.array(preds)


class KNNRegressor:
    def __init__(self, k=5):
        self.k = k
    def fit(self, X, y):
        self.X_ = X; self.y_ = y
        return self
    def predict(self, X):
        preds = []
        for x in X:
            dists = np.sqrt(np.sum((self.X_ - x) ** 2, axis=1))
            nn_idx = np.argsort(dists)[: self.k]
            preds.append(self.y_[nn_idx].mean())
        return np.array(preds)


# ---------------------------------------------------------------------------
# Decision Tree (Ch 4) -- Gini for classification, MSE for regression
# ---------------------------------------------------------------------------
class DecisionNode:
    __slots__ = ["feature", "threshold", "left", "right", "prediction", "is_leaf"]


def gini(y):
    _, counts = np.unique(y, return_counts=True)
    p = counts / counts.sum()
    return 1 - np.sum(p ** 2)


def build_tree_classifier(X, y, depth, max_depth, feature_subset=None, min_samples=2):
    node = DecisionNode()
    if depth >= max_depth or len(y) < min_samples or len(np.unique(y)) == 1:
        labels, counts = np.unique(y, return_counts=True)
        node.is_leaf = True
        node.prediction = labels[np.argmax(counts)]
        return node

    n_features = X.shape[1]
    features = feature_subset if feature_subset is not None else range(n_features)
    best_gain, best_feat, best_thr = -1, None, None
    parent_gini = gini(y)

    for f in features:
        values = np.unique(X[:, f])
        thresholds = (values[:-1] + values[1:]) / 2 if len(values) > 1 else values
        for t in thresholds:
            left_mask = X[:, f] <= t
            if left_mask.sum() == 0 or (~left_mask).sum() == 0:
                continue
            g_left = gini(y[left_mask])
            g_right = gini(y[~left_mask])
            w_left = left_mask.sum() / len(y)
            w_right = 1 - w_left
            weighted_gini = w_left * g_left + w_right * g_right
            gain = parent_gini - weighted_gini
            if gain > best_gain:
                best_gain, best_feat, best_thr = gain, f, t

    if best_feat is None or best_gain <= 1e-12:
        labels, counts = np.unique(y, return_counts=True)
        node.is_leaf = True
        node.prediction = labels[np.argmax(counts)]
        return node

    node.is_leaf = False
    node.feature = best_feat
    node.threshold = best_thr
    left_mask = X[:, best_feat] <= best_thr
    node.left = build_tree_classifier(X[left_mask], y[left_mask], depth + 1, max_depth, feature_subset, min_samples)
    node.right = build_tree_classifier(X[~left_mask], y[~left_mask], depth + 1, max_depth, feature_subset, min_samples)
    return node


def build_tree_regressor(X, y, depth, max_depth, min_samples=2):
    node = DecisionNode()
    if depth >= max_depth or len(y) < min_samples or np.var(y) < 1e-9:
        node.is_leaf = True
        node.prediction = float(y.mean())
        return node

    n_features = X.shape[1]
    best_gain, best_feat, best_thr = -1, None, None
    parent_mse = np.var(y)

    for f in range(n_features):
        values = np.unique(X[:, f])
        thresholds = (values[:-1] + values[1:]) / 2 if len(values) > 1 else values
        for t in thresholds:
            left_mask = X[:, f] <= t
            if left_mask.sum() == 0 or (~left_mask).sum() == 0:
                continue
            w_left = left_mask.sum() / len(y)
            w_right = 1 - w_left
            weighted_mse = w_left * np.var(y[left_mask]) + w_right * np.var(y[~left_mask])
            gain = parent_mse - weighted_mse
            if gain > best_gain:
                best_gain, best_feat, best_thr = gain, f, t

    if best_feat is None or best_gain <= 1e-9:
        node.is_leaf = True
        node.prediction = float(y.mean())
        return node

    node.is_leaf = False
    node.feature = best_feat
    node.threshold = best_thr
    left_mask = X[:, best_feat] <= best_thr
    node.left = build_tree_regressor(X[left_mask], y[left_mask], depth + 1, max_depth, min_samples)
    node.right = build_tree_regressor(X[~left_mask], y[~left_mask], depth + 1, max_depth, min_samples)
    return node


def predict_tree(node, x):
    while not node.is_leaf:
        node = node.left if x[node.feature] <= node.threshold else node.right
    return node.prediction


class DecisionTreeClassifier:
    def __init__(self, max_depth=6):
        self.max_depth = max_depth
    def fit(self, X, y):
        self.root_ = build_tree_classifier(X, y, 0, self.max_depth)
        self.n_features_ = X.shape[1]
        return self
    def predict(self, X):
        return np.array([predict_tree(self.root_, x) for x in X])
    def feature_importances(self, feature_names):
        importances = np.zeros(self.n_features_)
        total_samples = [0]
        def walk(node, n_samples):
            if node.is_leaf:
                return
            importances[node.feature] += n_samples  # simple usage-count proxy
            walk(node.left, n_samples)
            walk(node.right, n_samples)
        walk(self.root_, 1)
        if importances.sum() > 0:
            importances = importances / importances.sum()
        return dict(zip(feature_names, importances.round(4).tolist()))


class DecisionTreeRegressor:
    def __init__(self, max_depth=5):
        self.max_depth = max_depth
    def fit(self, X, y):
        self.root_ = build_tree_regressor(X, y, 0, self.max_depth)
        return self
    def predict(self, X):
        return np.array([predict_tree(self.root_, x) for x in X])


class RandomForestClassifier:
    def __init__(self, n_estimators=50, max_depth=6, max_features="sqrt", seed=RANDOM_STATE):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.max_features = max_features
        self.seed = seed
    def fit(self, X, y):
        n_samples, n_features = X.shape
        m = max(1, int(np.sqrt(n_features))) if self.max_features == "sqrt" else n_features
        rng_local = np.random.default_rng(self.seed)
        self.trees_ = []
        self.feature_sets_ = []
        for i in range(self.n_estimators):
            boot_idx = rng_local.integers(0, n_samples, n_samples)
            feat_idx = rng_local.choice(n_features, m, replace=False)
            Xb, yb = X[boot_idx][:, feat_idx], y[boot_idx]
            tree = build_tree_classifier(Xb, yb, 0, self.max_depth, feature_subset=range(m))
            self.trees_.append(tree)
            self.feature_sets_.append(feat_idx)
        self.n_features_ = n_features
        return self
    def predict(self, X):
        all_preds = []
        for tree, feat_idx in zip(self.trees_, self.feature_sets_):
            Xf = X[:, feat_idx]
            all_preds.append(np.array([predict_tree(tree, x) for x in Xf]))
        all_preds = np.array(all_preds)  # (n_estimators, n_samples)
        final = []
        for i in range(X.shape[0]):
            labels, counts = np.unique(all_preds[:, i], return_counts=True)
            final.append(labels[np.argmax(counts)])
        return np.array(final)
    def feature_importances(self, feature_names):
        importances = np.zeros(self.n_features_)
        for tree, feat_idx in zip(self.trees_, self.feature_sets_):
            def walk(node):
                if node.is_leaf:
                    return
                importances[feat_idx[node.feature]] += 1
                walk(node.left); walk(node.right)
            walk(tree)
        if importances.sum() > 0:
            importances = importances / importances.sum()
        return dict(zip(feature_names, importances.round(4).tolist()))


# ---------------------------------------------------------------------------
# K-Means (Ch 2) with K-Means++ init, and DBSCAN (Ch 2.2)
# ---------------------------------------------------------------------------
def kmeans_plus_plus_init(X, k, seed=RANDOM_STATE):
    rng_local = np.random.default_rng(seed)
    centers = [X[rng_local.integers(0, len(X))]]
    for _ in range(1, k):
        dists = np.min([np.sum((X - c) ** 2, axis=1) for c in centers], axis=0)
        probs = dists / dists.sum()
        next_idx = rng_local.choice(len(X), p=probs)
        centers.append(X[next_idx])
    return np.array(centers)


def kmeans(X, k, seed=RANDOM_STATE, max_iter=100):
    centers = kmeans_plus_plus_init(X, k, seed)
    for _ in range(max_iter):
        dists = np.array([np.sum((X - c) ** 2, axis=1) for c in centers]).T
        labels = np.argmin(dists, axis=1)
        new_centers = np.array([
            X[labels == i].mean(axis=0) if np.any(labels == i) else centers[i]
            for i in range(k)
        ])
        if np.allclose(new_centers, centers):
            break
        centers = new_centers
    dists = np.array([np.sum((X - c) ** 2, axis=1) for c in centers]).T
    labels = np.argmin(dists, axis=1)
    wcss = float(np.sum([np.sum((X[labels == i] - centers[i]) ** 2) for i in range(k)]))
    return labels, centers, wcss


def silhouette_score(X, labels):
    n = len(X)
    unique_labels = np.unique(labels)
    if len(unique_labels) < 2:
        return 0.0
    dist_matrix = np.sqrt(((X[:, None, :] - X[None, :, :]) ** 2).sum(axis=2))
    s = np.zeros(n)
    for i in range(n):
        same = labels == labels[i]
        same[i] = False
        if same.sum() == 0:
            s[i] = 0
            continue
        a = dist_matrix[i, same].mean()
        b = np.inf
        for l in unique_labels:
            if l == labels[i]:
                continue
            other = labels == l
            if other.sum() == 0:
                continue
            b = min(b, dist_matrix[i, other].mean())
        s[i] = (b - a) / max(a, b) if max(a, b) > 0 else 0
    return float(s.mean())


def dbscan(X, eps=1.5, min_samples=5):
    n = len(X)
    labels = np.full(n, -2)  # -2 = unvisited
    dist_matrix = np.sqrt(((X[:, None, :] - X[None, :, :]) ** 2).sum(axis=2))
    cluster_id = 0
    for i in range(n):
        if labels[i] != -2:
            continue
        neighbors = np.where(dist_matrix[i] <= eps)[0]
        if len(neighbors) < min_samples:
            labels[i] = -1  # noise
            continue
        labels[i] = cluster_id
        seeds = list(neighbors)
        j = 0
        while j < len(seeds):
            q = seeds[j]
            if labels[q] == -1:
                labels[q] = cluster_id
            if labels[q] == -2:
                labels[q] = cluster_id
                q_neighbors = np.where(dist_matrix[q] <= eps)[0]
                if len(q_neighbors) >= min_samples:
                    seeds.extend([x for x in q_neighbors if x not in seeds])
            j += 1
        cluster_id += 1
    return labels


# ===========================================================================
# TASK 1: Category classification
# ===========================================================================
print("\n=== Task 1: Category Classification ===")
X_raw = df[EMISSION_KEYS].values.astype(float)
y = df["category"].values

X_train, X_test, y_train, y_test = stratified_train_test_split(X_raw, y, test_size=0.2)
scaler = StandardScaler().fit(X_train)
X_train_s, X_test_s = scaler.transform(X_train), scaler.transform(X_test)

results = {"dataset": {
    "n_products": int(len(df)),
    "n_categories": int(df["category"].nunique()),
    "category_counts": df["category"].value_counts().to_dict(),
}}

# KNN: CV over odd k on scaled features
k_candidates = [k for k in range(1, 16) if k % 2 == 1]
cv_scores = {}
for k in k_candidates:
    accs = []
    for tr_idx, va_idx in kfold_indices(len(X_train_s), k=5):
        knn = KNNClassifier(k=k).fit(X_train_s[tr_idx], y_train[tr_idx])
        preds = knn.predict(X_train_s[va_idx])
        accs.append(accuracy(y_train[va_idx], preds))
    cv_scores[k] = float(np.mean(accs))
best_k = max(cv_scores, key=cv_scores.get)
knn_final = KNNClassifier(k=best_k).fit(X_train_s, y_train)
knn_pred = knn_final.predict(X_test_s)
p, r, f1 = precision_recall_f1_weighted(y_test, knn_pred)
labels_sorted = sorted(np.unique(y).tolist())
results["knn"] = {
    "best_k": best_k, "cv_scores_by_k": cv_scores,
    "accuracy": round(accuracy(y_test, knn_pred), 4),
    "precision_weighted": round(p, 4), "recall_weighted": round(r, 4), "f1_weighted": round(f1, 4),
    "confusion_matrix": confusion_matrix(y_test, knn_pred, labels_sorted).tolist(), "labels": labels_sorted,
}
print("KNN done. best_k =", best_k, "acc =", results["knn"]["accuracy"])

# Decision Tree (raw features, Ch 4)
dt = DecisionTreeClassifier(max_depth=6).fit(X_train, y_train)
dt_pred = dt.predict(X_test)
p, r, f1 = precision_recall_f1_weighted(y_test, dt_pred)
results["decision_tree_gini"] = {
    "accuracy": round(accuracy(y_test, dt_pred), 4),
    "precision_weighted": round(p, 4), "recall_weighted": round(r, 4), "f1_weighted": round(f1, 4),
    "confusion_matrix": confusion_matrix(y_test, dt_pred, labels_sorted).tolist(), "labels": labels_sorted,
    "feature_importances": dt.feature_importances(EMISSION_KEYS),
}
print("Decision Tree done. acc =", results["decision_tree_gini"]["accuracy"])

# Random Forest (Ch 5, bagging)
rf = RandomForestClassifier(n_estimators=50, max_depth=6).fit(X_train, y_train)
rf_pred = rf.predict(X_test)
p, r, f1 = precision_recall_f1_weighted(y_test, rf_pred)
results["random_forest"] = {
    "accuracy": round(accuracy(y_test, rf_pred), 4),
    "precision_weighted": round(p, 4), "recall_weighted": round(r, 4), "f1_weighted": round(f1, 4),
    "confusion_matrix": confusion_matrix(y_test, rf_pred, labels_sorted).tolist(), "labels": labels_sorted,
    "feature_importances": rf.feature_importances(EMISSION_KEYS),
}
print("Random Forest done. acc =", results["random_forest"]["accuracy"])

best_model_name = max(
    ["knn", "decision_tree_gini", "random_forest"],
    key=lambda k: results[k]["f1_weighted"],
)
results["_best_model"] = best_model_name
print("Best model:", best_model_name)

# ===========================================================================
# TASK 2: Emissions estimation regression (data-gap fallback)
# ===========================================================================
print("\n=== Task 2: Emissions Estimation Regression ===")
Xp_raw = df[PARTIAL_KEYS].values.astype(float)
yt = df["total_emissions"].values.astype(float)

Xp_train, Xp_test, yt_train, yt_test = X_train, X_test, None, None
# simple non-stratified split for regression
idx_all = np.arange(len(df))
rng.shuffle(idx_all)
n_test = int(round(0.2 * len(df)))
test_idx_r, train_idx_r = idx_all[:n_test], idx_all[n_test:]
Xp_train, Xp_test = Xp_raw[train_idx_r], Xp_raw[test_idx_r]
yt_train, yt_test = yt[train_idx_r], yt[test_idx_r]

p_scaler = StandardScaler().fit(Xp_train)
Xp_train_s, Xp_test_s = p_scaler.transform(Xp_train), p_scaler.transform(Xp_test)

reg_results = {}
k_candidates_r = [k for k in range(1, 16) if k % 2 == 1]
cv_mae = {}
for k in k_candidates_r:
    maes = []
    for tr_idx, va_idx in kfold_indices(len(Xp_train_s), k=5):
        knnr = KNNRegressor(k=k).fit(Xp_train_s[tr_idx], yt_train[tr_idx])
        preds = knnr.predict(Xp_train_s[va_idx])
        maes.append(mae(yt_train[va_idx], preds))
    cv_mae[k] = float(np.mean(maes))
best_k_r = min(cv_mae, key=cv_mae.get)
knnr_final = KNNRegressor(k=best_k_r).fit(Xp_train_s, yt_train)
knnr_pred = knnr_final.predict(Xp_test_s)
reg_results["knn_regressor"] = {
    "best_k": best_k_r,
    "mae": round(mae(yt_test, knnr_pred), 4), "rmse": round(rmse(yt_test, knnr_pred), 4), "r2": round(r2(yt_test, knnr_pred), 4),
}

dtr = DecisionTreeRegressor(max_depth=5).fit(Xp_train, yt_train)
dtr_pred = dtr.predict(Xp_test)
reg_results["decision_tree_regressor"] = {
    "mae": round(mae(yt_test, dtr_pred), 4), "rmse": round(rmse(yt_test, dtr_pred), 4), "r2": round(r2(yt_test, dtr_pred), 4),
}

baseline_pred = np.full_like(yt_test, yt_train.mean())
reg_results["baseline_mean"] = {
    "mae": round(mae(yt_test, baseline_pred), 4), "rmse": round(rmse(yt_test, baseline_pred), 4), "r2": round(r2(yt_test, baseline_pred), 4),
}
print("Regression done.", json.dumps(reg_results, indent=2))
results["regression"] = reg_results

# ===========================================================================
# TASK 3: Clustering
# ===========================================================================
print("\n=== Task 3: Clustering ===")
X_all_s = StandardScaler().fit_transform(X_raw)

wcss_by_k, sil_by_k = {}, {}
for k in range(2, 13):
    labels_k, centers_k, wcss_k = kmeans(X_all_s, k)
    wcss_by_k[k] = round(wcss_k, 2)
    sil_by_k[k] = round(silhouette_score(X_all_s, labels_k), 4)

best_k_cluster = max(sil_by_k, key=sil_by_k.get)
final_labels, final_centers, final_wcss = kmeans(X_all_s, best_k_cluster)
crosstab = pd.crosstab(df["category"], final_labels)

db_labels = dbscan(X_all_s, eps=1.5, min_samples=5)
n_clusters_db = len(set(db_labels)) - (1 if -1 in db_labels else 0)
n_noise = int(np.sum(db_labels == -1))

results["clustering"] = {
    "kmeans": {
        "wcss_by_k": wcss_by_k, "silhouette_by_k": sil_by_k, "chosen_k": int(best_k_cluster),
        "cluster_vs_category_crosstab": crosstab.to_dict(),
    },
    "dbscan": {
        "eps": 1.5, "min_samples": 5, "n_clusters_found": n_clusters_db,
        "n_noise_points": n_noise, "noise_pct": round(n_noise / len(df) * 100, 2),
    },
}
print("Clustering done. best_k =", best_k_cluster, "silhouette =", sil_by_k[best_k_cluster])
print("DBSCAN: clusters =", n_clusters_db, "noise =", n_noise)

with open("metrics_summary_full.json", "w") as f:
    json.dump(results, f, indent=2, default=str)
print("\nWrote metrics_summary_full.json")
