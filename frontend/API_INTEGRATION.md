# CI4 API Integration

The React app talks to the CodeIgniter 4 backend at
[psinghalnoida/ebid.oreo](https://github.com/psinghalnoida/ebid.oreo).
Every route in that repo's `app/Config/Routes.php` has a corresponding
function in `src/api/endpoints.js`.

## Setup

```bash
cp .env.example .env      # set VITE_API_PROXY_TARGET to your CI4 host
npm install
npm run dev
```

By default `VITE_API_BASE_URL` is blank and Vite proxies backend
prefixes (`/api`, `/browse`, `/sale-events`, `/chronicles`,
`/tender-view`, `/my-searches`, `/ticker-feed`, `/account/invoices`, …)
to `VITE_API_PROXY_TARGET` (default `http://localhost:8080`). For a
deployed backend on another origin, set `VITE_API_BASE_URL` instead —
note the backend's `app/Config/Cors.php` currently has empty
`allowedOrigins`, so cross-origin calls need that filled in server-side.

## Layers

| File | Role |
| --- | --- |
| `src/api/client.js` | fetch wrapper — base URL, Bearer token, JSON, `ApiError`, 401 broadcast, Blob downloads |
| `src/api/endpoints.js` | every backend route, grouped by domain |
| `src/api/hooks.js` | `useApiQuery` (GET + loading/error/fallback), `useApiAction` (POST + pending/error) |
| `src/utils/auth.js` | JWT session, `useAuth`, `establishSession`, cached party record |

## Auth

Mobile-OTP + mPIN per BR-02, matching `UserAuthApiController`:

1. `auth.registerRequestOtp(mobile)` → `{ dev_otp }` (SMS provider is stubbed server-side)
2. `auth.registerVerifyOtp(mobile, otp)` → `{ pending_ticket }`
3. `auth.completeMpin(pending_ticket, mpin)` → `{ access_token, party }`

`establishSession(result)` stores the JWT under `adwitix_jwt` and the
party under `adwitix_auth`. Returning users use
`auth.loginWithMpin(mobile, mpin)`, which returns one of three shapes
(`ok`, `otp_required`, `invalid_mpin`). Logout is client-side only — the
backend has no `/logout` route, so we discard the token. Any 401 from
the API broadcasts an event that clears the session automatically.

## Endpoint groups

`auth`, `adminAuth`, `listings`, `saleEvents`, `settlements`, `disputes`,
`me`, `account`, `kyc`, `tenants`, `sellerApplications`, `admin`,
`tender`, `discovery`, `lotReach`, `chronicle`, `invoices`, `content`,
`tenantApi`.

```js
import { me, admin } from '../api/endpoints.js';
import { useApiQuery } from '../api/hooks.js';

const { data, loading, error, reload } = useApiQuery(() => me.buyerDashboard(), []);
```

CSV/PDF exports return Blobs (the backend sends `text/csv` with a
`Content-Disposition`, and a plain `<a href>` can't carry the Bearer
header):

```js
import { saveBlob } from '../api/client.js';
saveBlob(await me.purchasesExport(), 'my-purchases.csv');
```

## Screens wired to live data

| Area | Screens → endpoints |
| --- | --- |
| Auth & account | Onboarding, Forgot mPIN (`auth.*`); Change mPIN, Delete Account, Payout Bank (`account.*`); Preferences (`account.preferences`/`savePreferences`); KYC (`kyc.*` — questionnaire, banking, addresses, document upload, submit) |
| Trader | Buyer Dashboard (`me.buyerDashboard`, `me.purchases`, `discovery.tickerFeed`, offer withdraw, CSV export); Marketplace + Saved Searches (`discovery.*`); Lot Detail, Bidding Room `?id=` (`listings.show`, `saleEvents.placeBid`/`expressBid`/`submitOffer`); EMD Consent `?saleEvent=&format=`; Star Ratings, Rating History |
| Market Maker | Seller Dashboard, Create Lot, Apply to Sell `?tenant=`, Lot Reach & Interest (`lotReach.*`), Defect Disclosure `?saleEvent=` |
| Settlement & disputes | Settlement `?id=` (NOCs, ratings), Dispute Center `?id=` / `?saleEvent=`, AX Chronicle `?id=`, Chronicle Verify `?token=` |
| TSX Master | Tenant Admin Dashboard, Lot Approval, Lot Directory |
| Custodian | Dashboard, Alerts, KYC Queue, AML Monitoring, Audit Ledger, Audit Chain Verify, Consent Audit, Statutory Export, Delist Market Maker, Media Waivers, Rules & Specifications, Whitelist Tenant, Invoices (`admin.tenantInvoices`), User Directory/Detail, Trading Session Directory, TradeSphereX Directory, Payout Reviews, Rating Reviews, Chargeback Handling |

Screens opened without their `?id=`-style parameter keep their designed
demo data. Still on designed data, because the backend has no JSON route
for them yet: the Tender screens (`TenderController` is session/redirect
based), Lot Chronicle (lot-wide history), Activity Log (no session
telemetry), and the static legal/info pages.

`/browse`, `/my-searches`, `/my-listings/reach` and `/chronicles/:id`
render HTML server side; the app uses their JSON counterparts under
`/api/v1/app` instead.

## Response conventions

- Every response is wrapped as `{ status, message, data }`. `useApiQuery`
  and `useApiAction` unwrap it; direct calls use `unwrap(res)`.
- Failure: 4xx/5xx with `{ status: false, message, data: { error } }` → thrown as `ApiError` (`.status`, `.code`, `.description`)
- Field names come back snake_case; mapping happens at each call site
