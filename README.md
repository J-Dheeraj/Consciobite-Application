# Consciobite

An application that enlightens users on the environmental footprint of edible products. Empowering consumers to make informed, sustainable choices every time they shop.

## Features

- **GreenGrade Algorithm** — Scores food products 0-10 based on carbon emissions across 7 supply chain categories (Land Use Change, Animal Feed, Farm, Processing, Transport, Packaging, Retail)
- **Color-Coded Grades** — Green (7-10), Yellow (4-6.9), Red (0-3.9) for instant visual assessment
- **Emissions Breakdown** — Detailed per-category emissions data for transparency
- **Barcode Scanning** — Look up any product's GreenGrade by barcode
- **Product Search & Filter** — Search, filter by category, and sort by sustainability score
- **Purchase Links** — Direct links to buy products from partner sellers

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: React 18 + React Router
- **Algorithm**: Custom GreenGrade scoring engine

## Getting Started

### Backend
```bash
cd backend
npm install
npm start        # runs on http://localhost:4000
```

### Frontend
```bash
cd frontend
npm install
npm start        # runs on http://localhost:3000
```

## Deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

1. Go to [render.com/deploy](https://render.com/deploy)
2. Connect your GitHub account and select this repository
3. Render will auto-detect the `render.yaml` blueprint
4. Click **Apply** to create both services (API + frontend)
5. Wait for deployment — your app will be live at `https://consciobite-app.onrender.com`

> Note: Free tier services spin down after inactivity. First request after idle may take 30-60 seconds.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products (supports `?search=`, `?category=`, `?sort=grade_desc`) |
| GET | `/api/products/:id` | Get product detail with full GreenGrade breakdown |
| GET | `/api/products/scan/:barcode` | Look up product by barcode |
| GET | `/api/health` | Health check |

## Team

Built by Adrin, Sanjay, Karthikraj, Shanthosh, and Dheeraj — five university friends bringing interdisciplinary expertise to sustainable food technology.
