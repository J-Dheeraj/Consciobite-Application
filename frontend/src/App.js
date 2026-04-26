import React, { Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import BottomNav from "./components/BottomNav";
import ErrorBoundary from "./components/ErrorBoundary";

// Eagerly loaded (critical path)
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";

// Lazy loaded (code splitting)
const Products = lazy(() => import("./pages/Products"));
const Scan = lazy(() => import("./pages/Scan"));
const Compare = lazy(() => import("./pages/Compare"));
const Favorites = lazy(() => import("./pages/Favorites"));
const About = lazy(() => import("./pages/About"));
const Tips = lazy(() => import("./pages/Tips"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const CarbonTracker = lazy(() => import("./pages/CarbonTracker"));
const Recipes = lazy(() => import("./pages/Recipes"));
const Methodology = lazy(() => import("./pages/Methodology"));
const NotFound = lazy(() => import("./pages/NotFound"));

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PageLoader() {
  return (
    <div style={{ padding: 48, textAlign: "center", color: "#888" }}>
      <div
        style={{
          width: 36,
          height: 36,
          border: "3px solid #d8f3dc",
          borderTopColor: "#2d6a4f",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 12px",
        }}
      />
      Loading...
    </div>
  );
}

export default function App() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <ScrollToTop />
      <Navbar />
      <ErrorBoundary>
        <main id="main-content" style={{ flex: 1 }}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/products" element={<Products />} />
              <Route path="/scan" element={<Scan />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/about" element={<About />} />
              <Route path="/tips" element={<Tips />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/carbon"
                element={
                  <RequireAuth>
                    <CarbonTracker />
                  </RequireAuth>
                }
              />
              <Route path="/recipes" element={<Recipes />} />
              <Route path="/methodology" element={<Methodology />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
      </ErrorBoundary>
      <Footer />
      <BottomNav />
    </div>
  );
}
