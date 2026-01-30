import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Scan from "./pages/Scan";
import About from "./pages/About";

export default function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/scan" element={<Scan />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </div>
  );
}
