import React, { useEffect, useState } from "react";
import { fetchProducts } from "../services/api";
import ProductCard from "../components/ProductCard";

const CATEGORIES = ["All", "Protein", "Beverages", "Dairy & Eggs", "Seafood", "Grains", "Snacks", "Fruits"];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("grade_desc");

  useEffect(() => {
    fetchProducts({
      search: search || undefined,
      category: category === "All" ? undefined : category,
      sort,
    }).then(setProducts);
  }, [search, category, sort]);

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginBottom: 4 }}>Discover Sustainable Food</h1>
      <p style={{ color: "#666", marginBottom: 20, fontSize: "0.9rem" }}>
        Browse products and their GreenGrade sustainability scores.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 180,
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: "0.9rem",
          }}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc" }}
        >
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc" }}
        >
          <option value="grade_desc">Best Grade First</option>
          <option value="grade_asc">Lowest Grade First</option>
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {products.length === 0 && <p style={{ color: "#888" }}>No products found.</p>}
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
