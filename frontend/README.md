# AdwitiX eBid Hub — React App

Vite + React + React Router. No CSS framework — one shared `theme.css` (design tokens as CSS variables) plus per-component/page CSS files. No inline styles.

## Setup
```
cd design_handoff_ebid_hub/react-app
npm install
npm run dev       # dev server, http://localhost:5173
npm run build      # production build -> dist/
npm run preview    # preview the production build
```
Deploy `dist/` to your own server (any static file host / nginx / etc). This resolves the deployment issues with the raw `.dc.html` files — this is a standard static SPA build.

## Structure
```
src/
  styles/theme.css      shared design tokens (colors, fonts, radii)
  styles/global.css     resets, base element styles
  components/           shared UI: SiteHeader, SiteFooter (public pages),
                         DashboardHeader (internal role dashboards)
  pages/<area>/          one folder per screen area, each screen = .jsx + co-located .css
  routes.jsx             central path -> page map
  App.jsx                router outlet
```

## Converted so far
- `pages/landing/LandingPage.jsx` — public landing page
- `pages/custodian/CustodianLogin.jsx` — Custodian auth (3-stage: credentials → TOTP → done)
- `pages/custodian/CustodianDashboard.jsx` — Custodian oversight dashboard
- `pages/dashboards/BuyerDashboard.jsx`, `SellerDashboard.jsx`, `TenantAdminDashboard.jsx` — role dashboards
- `pages/dashboards/Profile.jsx`, `Preferences.jsx` — account management
- Marketplace/Lot lifecycle screens under `pages/marketplace/` and `pages/lots/`
- Legal/policy pages under `pages/legal/`

Remaining: dispute & settlement ops, compliance/admin tools (AML, KYC Queue, Payout Reviews, etc.), directories (User/Trading Session), account sub-screens (Change mPIN, Delete Account, Saved Searches, Payout Bank, Rating History, Activity Log), notifications, and Tender Auction back-office screens.

## Notes
- Routing uses `react-router-dom` `<Link>`; `.dc.html` cross-links were rewritten to clean paths (e.g. `Custodian Dashboard.dc.html` → `/custodian/dashboard`). Add matching `<Route>` entries in `routes.jsx` as each target page is converted.
- Shared header/footer components take props rather than being duplicated per page — extend them instead of copy-pasting when a new screen needs a header variant.
- No CSS framework; extend `theme.css` variables first before hardcoding new colors.
