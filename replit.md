# Retail & Inventory Management System

A React-based admin portal for managing retail operations including inventory, orders, POS, users, and multi-tenant settings.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Framer Motion, React Router v7
- **Backend**: Express (Node.js) with mock in-memory data, JWT authentication
- **Build Tool**: Vite 6
- **Runtime**: tsx (runs TypeScript server directly)
- **AI**: Google Gemini AI integration (requires GEMINI_API_KEY)

## Project Structure

```
src/
  api/          - Generated API client + definitions
  components/   - Reusable UI components
  layouts/      - Layout wrappers (AdminLayout)
  pages/        - Feature pages (Auth, Dashboard, Products, Orders, POS, etc.)
  repositories/ - Data fetching abstraction layer
  routes/       - App routing (AppRoutes.tsx)
  state/        - Global state (AuthContext, SettingsContext)
  styles/       - Global CSS and Tailwind tokens
  theme/        - Tenant-specific theme providers
  utils/        - Helper functions
server.ts       - Express server (serves API + Vite dev middleware)
vite.config.ts  - Vite configuration
```

## Running the App

```bash
npm install
npm run dev
```

The server runs on port 5000, serving both the Express API and the Vite-bundled React frontend.

## Mock Credentials

- `owner@example.com` / `password123`
- `admin@example.com` / `password123`
- `staff@example.com` / `password123`
- `client@example.com` / `password123`

## Configuration

- `VITE_API_BASE_URL` - External API base URL (optional, for production backend)
- `VITE_SWAGGER_URL` - Swagger spec URL for API client generation
- `GEMINI_API_KEY` - Google Gemini AI API key

## Workflow

- **Start application**: `npm run dev` → port 5000 (webview)
