/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  // The repo root has its own package-lock.json (husky/prettier only), which
  // makes Turbopack guess the wrong workspace root. Pin it to this app.
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
