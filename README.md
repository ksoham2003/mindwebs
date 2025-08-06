# Environmental Data Dashboard

![Dashboard Screenshot](./public/screenshot.png)

A Next.js application for visualizing environmental data with interactive maps and temporal controls.

## Features

- 🗺️ Interactive Leaflet map with polygon drawing (3-12 points)
- ⏳ Timeline slider with single-point and range selection modes
- 🎨 Data source management with customizable color rules
- 🌡️ Real-time weather data from Open-Meteo API
- 📍 Polygon persistence and temperature visualization
- 📱 Responsive dashboard layout

## Tech Stack

- **Framework**: Next.js
- **Language**: TypeScript
- **State Management**: Zustand
- **Mapping**: Leaflet + React-Leaflet
- **Charts**: Recharts
- **UI**: Shadcn/ui + Tailwind CSS
- **Utilities**: date-fns

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm (v9 or later)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ksoham2003/mindwebs.git
   
2. Install dependencies:
   ```bash
   cd mindwebs-timeline
   npm install --legacy-peer-deps

3. Run the development server:
   ```bash
   npm run dev

4. Open [http://localhost:3000/](http://localhost:3000/) in your browser.

### Usage

## Drawing Polygons

1. Click the "Draw Polygon" button
2. Click on the map to create vertices (3-12 points)
3. Complete the polygon by clicking the first point
4. Name your polygon when prompted

## Timeline Controls

- Single Mode: Drag the slider to select a specific hour
- Range Mode: Drag both ends to select a time range
- Use the "Jump to Now" button to center on current time

## Data Sources

- Add new data sources in the sidebar
- Configure color rules for each source
- Assign data sources to polygons

### API Integration

The application uses the Open-Meteo API to fetch:
- Temperature data (temperature_2m)
- Historical weather data
- Time-series information

### Deployment
Deploy to Vercel:
[https://mindwebs-kappa.vercel.app/](https://mindwebs-kappa.vercel.app/)
