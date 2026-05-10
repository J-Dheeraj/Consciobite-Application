import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import "./globals.css";

export const metadata = {
  title: "Consciobite - Sustainable Food Choices",
  description:
    "Browse 550+ products with GreenGrade sustainability scoring. Compare environmental impact, track your carbon footprint, and discover greener alternatives.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/icon-192.png",
  },
  manifest: "/manifest.json",
  themeColor: "#2d6a4f",
  openGraph: {
    title: "Consciobite - Sustainable Food Choices",
    description: "Browse 550+ products with GreenGrade sustainability scoring.",
    siteName: "Consciobite",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh",
            }}
          >
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>
            <Navbar />
            <main id="main-content" role="main" style={{ flex: 1 }}>
              {children}
            </main>
            <Footer />
            <BottomNav />
            <div
              aria-live="polite"
              aria-atomic="true"
              id="announcer"
              style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}
            />
          </div>
        </Providers>
      </body>
    </html>
  );
}
