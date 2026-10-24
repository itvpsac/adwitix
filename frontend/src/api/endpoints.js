// Every endpoint exposed by the CI4 backend, grouped by domain.
// Mirrors app/Config/Routes.php one-for-one — see each group's comment
// for the business rule / migration phase it belongs to.
//
// Filter legend (server side): jwtAuth = logged-in party,
// jwtTenantAdmin = tenant admin, jwtSuperAdmin = Custodian/SaaS admin,
// apiAuth = OAuth2 client-credentials (tenant machine API), none = public.

import { api, getToken } from './client.js';

const APP = '/api/v1/app';
const ADMIN_APP = '/api/v1';

// GET /auth/me is asked for by every page header plus several pages, so
// calls share one request and its result for a minute per token — a page
// view would otherwise send it 2–4 times, which trips the host's rate limit.
const ME_TTL_MS = 60000;
let meCache = null;
function cachedMe() {
  const token = getToken();
  if (meCache && meCache.token === token && Date.now() - meCache.at < ME_TTL_MS) return meCache.promise;
  const promise = api.get(`${APP}/auth/me`).catch((err) => { meCache = null; throw err; });
  meCache = { token, at: Date.now(), promise };
  return promise;
}
const invalidateMe = (res) => { meCache = null; return res; };

// ── Auth: mobile-OTP + mPIN (BR-02, D-137 Phase 6) ──────────────────
export const auth = {
  requestOtp: (mobile_number) => api.post(`${APP}/auth/otp/request`, { mobile_number }, { auth: false }),
  verifyOtp: (mobile_number, otp) => api.post(`${APP}/auth/otp/verify`, { mobile_number, otp }, { auth: false }),
  submitProfile: (payload) => api.post(`${APP}/auth/submit`, payload, { auth: false }),
  me: cachedMe,

  registerRequestOtp: (mobile_number) => api.post(`${APP}/auth/register/otp/request`, { mobile_number }, { auth: false }),
  registerVerifyOtp: (mobile_number, otp) => api.post(`${APP}/auth/register/otp/verify`, { mobile_number, otp }, { auth: false }),
  loginWithMpin: (mobile_number, mpin) => api.post(`${APP}/auth/login`, { mobile_number, mpin }, { auth: false }),
  loginVerifyResetOtp: (pending_ticket, otp, email_otp) => api.post(`${APP}/auth/login/verify-reset-otp`, { pending_ticket, otp, email_otp }, { auth: false }),
  completeMpin: (pending_ticket, mpin) => api.post(`${APP}/auth/mpin/complete`, { pending_ticket, mpin }, { auth: false }),

  // Standalone forgot-password entry point (unauthenticated) — separate
  // from the lockout-triggered reset above, same shared verify/complete steps.
  forgotPassword: (mobile_number) => api.post(`${APP}/auth/forgot-password`, { mobile_number }, { auth: false }),
  forgotPasswordVerify: (pending_ticket, otp, email_otp) => api.post(`${APP}/auth/forgot-password/verify`, { pending_ticket, otp, email_otp }, { auth: false }),
};

// ── Super Admin auth (BR-04) ────────────────────────────────────────
export const adminAuth = {
  // Custodian login redesign — mobile + mPIN default, Google
  // Authenticator (TOTP) an equal alternative once enabled.
  loginMethods: (payload) => api.post(`${APP}/admin/auth/login-methods`, payload, { auth: false }),
  loginMpin: (payload) => api.post(`${APP}/admin/auth/login-mpin`, payload, { auth: false }),
  loginTotp: (payload) => api.post(`${APP}/admin/auth/login-totp`, payload, { auth: false }),
  mpinForgotRequest: (payload) => api.post(`${APP}/admin/auth/mpin/forgot`, payload, { auth: false }),
  mpinForgotVerify: (payload) => api.post(`${APP}/admin/auth/mpin/forgot/verify`, payload, { auth: false }),
  mpinForgotComplete: (payload) => api.post(`${APP}/admin/auth/mpin/forgot/complete`, payload, { auth: false }),

  // Legacy email+password+TOTP/email-OTP login — kept working server
  // side as a fallback, no longer offered by the login UI.
  login: (payload) => api.post(`${APP}/admin/auth/login`, payload, { auth: false }),
  verifyEmail: (payload) => api.post(`${APP}/admin/auth/login/verify-email`, payload, { auth: false }),
  setupTotp: () => api.post(`${APP}/admin/auth/setup-totp`),
  confirmSetupTotp: (payload) => api.post(`${APP}/admin/auth/setup-totp/confirm`, payload),
  // Mobile-OTP entry point for 2FA enrollment — no existing session
  // needed; owning the registered mobile number is itself the proof.
  setupTotpRequestOtp: (payload) => api.post(`${APP}/admin/auth/setup-totp/request-otp`, payload, { auth: false }),
  setupTotpVerifyOtp: (payload) => api.post(`${APP}/admin/auth/setup-totp/verify-otp`, payload, { auth: false }),
  confirmSetupTotpByMobile: (payload) => api.post(`${APP}/admin/auth/setup-totp/confirm-mobile`, payload, { auth: false }),
  forgotMpin: (payload) => api.post(`${APP}/admin/auth/forgot-mpin`, payload, { auth: false }),
  forgotMpinVerify: (payload) => api.post(`${APP}/admin/auth/forgot-mpin/verify`, payload, { auth: false }),
  // Custodian-facing naming aliases for the same two endpoints, plus the
  // completion step that actually sets the new password.
  forgotPassword: (payload) => api.post(`${APP}/admin/auth/forgot-password`, payload, { auth: false }),
  forgotPasswordVerify: (payload) => api.post(`${APP}/admin/auth/forgot-password/verify`, payload, { auth: false }),
  forgotPasswordComplete: (payload) => api.post(`${APP}/admin/auth/forgot-password/complete`, payload, { auth: false }),
};

// ── Listings & lifecycle (BR-11/BR-13) ──────────────────────────────
export const listings = {
  preAudit: (payload) => api.post(`${APP}/listings/pre-audit`, payload),
  create: (payload) => {
    const requiredFields = ['title', 'category', 'subcategory', 'physical_condition', 'pincode', 'full_address'];
    const missingFields = requiredFields.filter(field => !payload[field]);
    
    if (missingFields.length > 0) {
      console.error("DEBUG: listings.create missing required fields:", missingFields, "Payload:", payload);
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    return api.post(`${APP}/listings`, payload);
  },
  // Public route; the token is sent when present so viewer-specific fields
  // (myEmdHold, isOwner, …) come back filled in.
  show: (id) => api.get(`${APP}/listings/${id}`),
  edit: (id, payload) => api.post(`${APP}/listings/${id}/edit`, payload),
  favorite: (id) => api.post(`${APP}/listings/${id}/favorite`),
  unfavorite: (id) => api.post(`${APP}/listings/${id}/unfavorite`),
  flagCbsViolation: (id, payload) => api.post(`${APP}/listings/${id}/flag-cbs-violation`, payload),
  submitForApproval: (id) => api.post(`${APP}/listings/${id}/submit-for-approval`),
  approve: (id, payload) => api.post(`${APP}/listings/${id}/approve`, payload),
  reject: (id, payload) => api.post(`${APP}/listings/${id}/reject`, payload),
  createSaleEvent: (id, payload) => api.post(`${APP}/listings/${id}/sale-events`, payload),
  uploadMedia: (id, formData) => api.post(`${APP}/listings/${id}/media`, formData),
  setPrimaryMedia: (id, mediaId) => api.post(`${APP}/listings/${id}/media/${mediaId}/set-primary`),
};

// ── Sale events, bidding, offers, Express (BR-12/27/28/29/42) ───────
export const saleEvents = {
  approve: (id, payload) => api.post(`${APP}/sale-events/${id}/approve`, payload),
  defectDisclosure: (id, payload) => api.post(`${APP}/sale-events/${id}/defect-disclosure`, payload),
  emergencyStop: (id, payload) => api.post(`${APP}/sale-events/${id}/emergency-stop`, payload),
  devForceFreeze: (id) => api.post(`${APP}/sale-events/${id}/dev-force-freeze`),

  fundEmd: (id, payload) => api.post(`${APP}/sale-events/${id}/dev-fund-emd`, payload),
  placeBid: (id, payload) => api.post(`${APP}/sale-events/${id}/bid`, payload),
  payTopup: (id, payload) => api.post(`${APP}/sale-events/${id}/dev-pay-topup`, payload),

  fundEmdForOffer: (id, payload) => api.post(`${APP}/sale-events/${id}/dev-fund-emd-offer`, payload),
  submitOffer: (id, payload) => api.post(`${APP}/sale-events/${id}/offers`, payload),
  acceptOffer: (id, offerId) => api.post(`${APP}/sale-events/${id}/offers/${offerId}/accept`),
  withdrawOffer: (offerId) => api.post(`${APP}/offers/${offerId}/withdraw`),

  pledge: (id, payload) => api.post(`${APP}/sale-events/${id}/pledge`, payload),
  expressBid: (id, payload) => api.post(`${APP}/sale-events/${id}/express-bid`, payload),
  forceCloseBidding: (id) => api.post(`${APP}/sale-events/${id}/dev-force-close-bidding`),

  fileDispute: (id, payload) => api.post(`${APP}/sale-events/${id}/dispute`, payload),
  fileChargeback: (id, payload) => api.post(`${APP}/sale-events/${id}/dev-file-chargeback`, payload),

  // action: 'easy_or_tender' | 'buy_now' | 'express' (EmdConsentController)
  emdConsentTerms: (id, action) => api.get(`${APP}/sale-events/${id}/emd-consent/${action}`),
  confirmEmdConsent: (id, action, payload) => api.post(`${APP}/sale-events/${id}/emd-consent/${action}/confirm`, payload),
};

// ── Settlement & ratings (BR-33/BR-39) ──────────────────────────────
export const settlements = {
  show: (id) => api.get(`${APP}/settlements/${id}`),
  confirmSellerNoc: (id, payload) => api.post(`${APP}/settlements/${id}/confirm-seller-noc`, payload),
  confirmBuyerNoc: (id, payload) => api.post(`${APP}/settlements/${id}/confirm-buyer-noc`, payload),
  rateAsBuyer: (id, payload) => api.post(`${APP}/settlements/${id}/rate-as-buyer`, payload),
  rateAsSeller: (id, payload) => api.post(`${APP}/settlements/${id}/rate-as-seller`, payload),
  forceResolve: (id, payload) => api.post(`${APP}/settlements/${id}/force-resolve`, payload),
  devFlagStalled: (payload) => api.post(`${APP}/settlements/dev-flag-stalled`, payload),
};

// ── Disputes (BR-40) ────────────────────────────────────────────────
export const disputes = {
  // The caller's disputes (filed, responding, tenant-admin scope, or all for Super Admin).
  mine: () => api.get(`${APP}/disputes`),
  show: (id) => api.get(`${APP}/disputes/${id}`),
  submitEvidence: (id, payload) => api.post(`${APP}/disputes/${id}/evidence`, payload),
  rule: (id, payload) => api.post(`${APP}/disputes/${id}/rule`, payload),
  appeal: (id, payload) => api.post(`${APP}/disputes/${id}/appeal`, payload),
  ruleOnAppeal: (id, payload) => api.post(`${APP}/disputes/${id}/rule-appeal`, payload),
};

// ── My activity & dashboards (Phase 3A/D-106) ───────────────────────
export const me = {
  profile: cachedMe,
  account: () => api.get(`${APP}/account`),
  activity: () => api.get(`${APP}/my-activity`),
  listings: () => api.get(`${APP}/my-listings`),
  bids: (query) => api.get(`${APP}/my-bids`, { query }),
  offers: (query) => api.get(`${APP}/my-offers`, { query }),
  purchases: (query) => api.get(`${APP}/my-purchases`, { query }),
  purchasesExport: () => api.download(`${APP}/my-purchases/export`),
  sales: (query) => api.get(`${APP}/my-sales`, { query }),
  salesExport: () => api.download(`${APP}/my-sales/export`),
  messages: () => api.get(`${APP}/my-messages`),
  markMessageRead: (id) => api.post(`${APP}/my-messages/${id}/read`),
  starRatings: () => api.get(`${APP}/my-star-ratings`),
  sellerTenants: () => api.get(`${APP}/my-seller-tenants`),
  ratingHistory: () => api.get(`${APP}/my-rating-history`),
  buyerDashboard: () => api.get(`${APP}/my-buyer-dashboard`),
  sellerDashboard: () => api.get(`${APP}/my-seller-dashboard`),
  earnings: () => api.get(`${APP}/account/earnings`),
};

// ── Account management (Phase 3A/Phase 4) ───────────────────────────
export const account = {
  edit: (payload) => api.post(`${APP}/account/edit`, payload).then(invalidateMe),
  changeMpinRequestOtp: () => api.post(`${APP}/account/change-mpin/request-otp`),
  changeMpinConfirm: (payload) => api.post(`${APP}/account/change-mpin/confirm`, payload),
  requestDelete: (payload) => api.post(`${APP}/account/delete/request`, payload),
  cancelDelete: () => api.post(`${APP}/account/delete/cancel`),
  preferences: () => api.get(`${APP}/preferences`),
  savePreferences: (payload) => api.post(`${APP}/preferences`, payload),
  requestPayoutBankChange: (payload) => api.post(`${APP}/payout-bank/request`, payload),
  confirmPayoutBankChange: (payload) => api.post(`${APP}/payout-bank/confirm`, payload),
};

// ── KYC (BR-17/18/55) ───────────────────────────────────────────────
export const kyc = {
  // GET /kyc returns the whole dossier (party, documents, addressesByType);
  // the questionnaire/documents/addresses/banking routes are POST-only.
  form: () => api.get(`${APP}/kyc`),
  saveQuestionnaire: (payload) => api.post(`${APP}/kyc/questionnaire`, payload),
  uploadDocument: (formData) => api.post(`${APP}/kyc/documents`, formData),
  saveAddress: (payload) => api.post(`${APP}/kyc/addresses`, payload),
  saveBanking: (payload) => api.post(`${APP}/kyc/banking`, payload),
  submit: () => api.post(`${APP}/kyc/submit`).then(invalidateMe),
};

// ── Tenants / TradeSphereX ──────────────────────────────────────────
export const tenants = {
  directory: () => api.get(`${APP}/tenants`, { auth: false }),
  applyStatus: (tenantId) => api.get(`${APP}/tenants/${tenantId}/apply-to-sell`),
  applyToSell: (tenantId, payload) => api.post(`${APP}/tenants/${tenantId}/apply-to-sell`, payload),
  pendingSellers: (tenantId) => api.get(`${APP}/tenants/${tenantId}/pending-sellers`),
  dashboard: (tenantId) => api.get(`${APP}/tenants/${tenantId}/dashboard`),
  verification: (tenantId) => api.get(`${APP}/tenants/${tenantId}/verification`),
  billing: (tenantId) => api.get(`${APP}/tenants/${tenantId}/billing`),
  sellers: (tenantId) => api.get(`${APP}/tenants/${tenantId}/sellers`),
  sellerDetail: (tenantId, sellerId) => api.get(`${APP}/tenants/${tenantId}/sellers/${sellerId}`),
  initiateSellerReview: (tenantId, sellerId, payload) => api.post(`${APP}/tenants/${tenantId}/sellers/${sellerId}/initiate-review`, payload),
  requestMediaWaiver: (tenantId, payload) => api.post(`${APP}/tenants/${tenantId}/media-waiver`, payload),
  apiAccess: (tenantId) => api.get(`${APP}/tenants/${tenantId}/api-access`),
  issueCredential: (tenantId, payload) => api.post(`${APP}/tenants/${tenantId}/api-access/credentials`, payload),
  revokeCredential: (tenantId, credentialId) => api.post(`${APP}/tenants/${tenantId}/api-access/credentials/${credentialId}/revoke`),
  updateWebhookUrl: (tenantId, payload) => api.post(`${APP}/tenants/${tenantId}/api-access/webhook-url`, payload),
};

// ── Seller applications (BR-09) ─────────────────────────────────────
export const sellerApplications = {
  approve: (id, payload) => api.post(`${APP}/seller-applications/${id}/approve`, payload),
  reject: (id, payload) => api.post(`${APP}/seller-applications/${id}/reject`, payload),
};

// ── Custodian / SaaS Admin (Phase 5) ────────────────────────────────
export const admin = {
  dashboard: () => api.get(`${APP}/admin`),
  alerts: () => api.get(`${APP}/admin/alerts`),
  decisionQueue: () => api.get(`${APP}/admin/decision-queue`),
  systemHealth: () => api.get(`${APP}/admin/system-health`),
  acknowledgeServerTimeDrift: (id) => api.post(`${APP}/admin/alerts/server-time-drift/${id}/acknowledge`),

  users: (query) => api.get(`${APP}/admin/users`, { query }),
  userDetail: (id) => api.get(`${APP}/admin/users/${id}`),
  promoteTenantAdmin: (id, payload) => api.post(`${APP}/admin/users/${id}/promote-tenant-admin`, payload),
  userDossier: (id) => api.get(`${APP}/admin/users/${id}/dossier`),
  createUser: (payload) => api.post(`${APP}/admin/users`, payload),
  editUser: (id, payload) => api.post(`${APP}/admin/users/${id}/edit`, payload),
  freezeUser: (id, reason) => api.post(`${APP}/admin/users/${id}/freeze`, { reason }),
  unfreezeUser: (id, reason) => api.post(`${APP}/admin/users/${id}/unfreeze`, { reason }),

  tenants: (query) => api.get(`${APP}/admin/tenants`, { query }),
  createTenant: (payload) => api.post(`${APP}/admin/tenants`, payload),
  tenant: (id) => api.get(`${APP}/admin/tenants/${id}`),
  editTenant: (id, payload) => api.post(`${APP}/admin/tenants/${id}/edit`, payload),
  deleteTenant: (id) => api.post(`${APP}/admin/tenants/${id}/delete`),

  lots: (query) => api.get(`${APP}/admin/lots`, { query }),
  tradingSessions: (query) => api.get(`${APP}/admin/trading-sessions`, { query }),
  lotDossier: (id) => api.get(`${APP}/admin/listings/${id}/dossier`),
  legalList: () => api.get(`${APP}/admin/legal`),
  legalDoc: (slug) => api.get(`${APP}/admin/legal/${slug}`),
  legalVersion: (slug, n) => api.get(`${APP}/admin/legal/${slug}/versions/${n}`),
  legalSaveDraft: (slug, payload) => api.post(`${APP}/admin/legal/${slug}/draft`, payload),
  legalPublish: (slug) => api.post(`${APP}/admin/legal/${slug}/publish`),
  legalDiscard: (slug) => api.post(`${APP}/admin/legal/${slug}/discard-draft`),
  legalRestore: (slug, n) => api.post(`${APP}/admin/legal/${slug}/restore/${n}`),
  plans: () => api.get(`${APP}/admin/plans`),
  savePlan: (key, payload) => api.post(`${APP}/admin/plans/${key}`, payload),
  raiseObjection: (id, payload) => api.post(`${APP}/admin/listings/${id}/objections`, payload),
  reviewObjection: (id, payload) => api.post(`${APP}/admin/objections/${id}/review`, payload),
  reactivateLot: (id, reason) => api.post(`${APP}/admin/listings/${id}/reactivate`, { reason }),
  stopLot: (id, reason) => api.post(`${APP}/admin/listings/${id}/stop`, { reason }),
  stopSession: (id, reason) => api.post(`${APP}/admin/sale-events/${id}/stop`, { reason }),

  kycQueue: (query) => api.get(`${APP}/admin/kyc`, { query }),
  kycDetail: (id) => api.get(`${APP}/admin/kyc/${id}`),
  kycVerifyFlag: (id, payload) => api.post(`${APP}/admin/kyc/${id}/verify-flag`, payload),
  kycDecide: (id, payload) => api.post(`${APP}/admin/kyc/${id}/decide`, payload),
  kycClearEdd: (id, payload) => api.post(`${APP}/admin/kyc/${id}/clear-edd`, payload),
  kycDocumentDownload: (docId) => api.download(`${APP}/admin/kyc-documents/${docId}/download`),

  aml: (query) => api.get(`${APP}/admin/aml`, { query }),
  amlReview: (id, payload) => api.post(`${APP}/admin/aml/${id}/review`, payload),

  auditLog: (query) => api.get(`${APP}/admin/audit-log`, { query }),
  auditLogVerify: () => api.get(`${APP}/admin/audit-log/verify`),
  auditLogExport: (query) => api.download(`${APP}/admin/audit-log/export`, { query }),

  consentAudit: (query) => api.get(`${APP}/admin/consent-audit`, { query }),
  consentAuditExport: (query) => api.download(`${APP}/admin/consent-audit/export`, { query }),

  mediaWaivers: () => api.get(`${APP}/admin/media-waivers`),
  decideMediaWaiver: (id, payload) => api.post(`${APP}/admin/media-waivers/${id}/decide`, payload),
  revokeMediaWaiver: (id, payload) => api.post(`${APP}/admin/media-waivers/${id}/revoke`, payload),

  payoutReviews: () => api.get(`${APP}/admin/payout-reviews`),
  decidePayoutReview: (id, payload) => api.post(`${APP}/admin/payout-reviews/${id}/decide`, payload),

  ratingReviews: () => api.get(`${APP}/admin/rating-reviews`),
  approveRatingReview: (id, payload) => api.post(`${APP}/admin/rating-reviews/${id}/approve`, payload),

  standingReview: (id) => api.get(`${APP}/admin/standing-review/${id}`),
  ruleStandingReview: (id, payload) => api.post(`${APP}/admin/standing-review/${id}/rule`, payload),

  chargebacks: () => api.get(`${APP}/admin/chargebacks`),
  decideChargeback: (id, payload) => api.post(`${APP}/admin/chargebacks/${id}/decide`, payload),
  reviewChargebackIntegrity: (id, payload) => api.post(`${APP}/admin/chargebacks/${id}/review-integrity`, payload),

  rules: () => api.get(`${APP}/admin/rules`),
  createRule: (payload) => api.post(`${APP}/admin/rules`, payload),
  rule: (id) => api.get(`${APP}/admin/rules/${id}`),
  editRule: (id, payload) => api.post(`${APP}/admin/rules/${id}/edit`, payload),

  tenantInvoices: (query) => api.get(`/api/v1/app/admin/tenant-invoices`, { query }),
  markInvoicePaid: (id, payload) => api.post(`/api/v1/app/admin/tenant-invoices/${id}/mark-paid`, payload),

  delistSeller: (payload) => api.post(`${APP}/admin/delist-seller`, payload),
};

// ── Tender (Concierge-operated, BR-12/BR-21/BR-26) ──────────────────
// Note: these live outside /api/v1/app in Routes.php.
export const tender = {
  registerInterest: (saleEventId, payload) => api.post(`/sale-events/${saleEventId}/tender/interest`, payload),
  eligibility: (saleEventId) => api.get(`/sale-events/${saleEventId}/tender/eligibility`),
  grantEligibility: (saleEventId, payload) => api.post(`/sale-events/${saleEventId}/tender/eligibility/grant`, payload),
  publishDocument: (saleEventId, formData) => api.post(`/sale-events/${saleEventId}/tender/documents`, formData),
  logEmd: (saleEventId, payload) => api.post(`/sale-events/${saleEventId}/tender/emd`, payload),
  placeBid: (saleEventId, payload) => api.post(`/sale-events/${saleEventId}/tender/bid`, payload),
  generateStakeholderLink: (saleEventId, payload) => api.post(`/sale-events/${saleEventId}/tender/stakeholder-link`, payload),
  stakeholderView: (token) => api.get(`/tender-view/${token}`, { auth: false }),
  closeBidding: (saleEventId, payload) => api.post(`/sale-events/${saleEventId}/tender/close-bidding`, payload),
  reviewAction: (reviewId, payload) => api.post(`/tender-reviews/${reviewId}/action`, payload),
  auctionReport: (saleEventId) => api.get(`/sale-events/${saleEventId}/tender/report`),
};

// ── Discovery, browse, ticker (Phase 3C+) ───────────────────────────
// The /browse, /my-searches… page routes render HTML; these are their JSON
// counterparts under /api/v1/app. browse sends the token when present so
// results carry the CLV match flag.
export const discovery = {
  browse: (query) => api.get(`${APP}/browse`, { query }),
  favorites: () => api.get(`${APP}/my-favorites`),
  savedSearches: () => api.get(`${APP}/my-searches`),
  saveSearch: (payload) => api.post(`${APP}/my-searches`, payload),
  deleteSearch: (id) => api.post(`${APP}/my-searches/${id}/delete`),
  searchHistory: () => api.get(`${APP}/search-history`),
  recommendations: () => api.get(`${APP}/recommendations`),
  // Viewer-scoped (own bids + interest matches), so the token is sent.
  tickerFeed: () => api.get('/ticker-feed'),
};

// ── Lot Reach & Interest (D-105) ────────────────────────────────────
export const lotReach = {
  index: (query) => api.get(`${APP}/my-listings/reach`, { query }),
  sendMessage: (listingId, payload) => api.post(`${APP}/listings/${listingId}/reach/message`, payload),
};

// ── Chronicle (Section 7.10) — verify routes are token-only, public ──
// view/verify are the JSON routes; the PDFs come from the page routes
// (download needs the token — only parties to the settlement may fetch it).
export const chronicle = {
  view: (id) => api.get(`${APP}/chronicles/${id}`),
  download: (id) => api.download(`/chronicles/${id}/download`),
  verify: (token) => api.get(`${APP}/chronicle/verify/${token}`, { auth: false }),
  verifyPdf: (token) => api.download(`/chronicle/verify/${token}/pdf`, { auth: false }),
};

// ── Invoices (BR-56) ────────────────────────────────────────────────
export const invoices = {
  index: (query) => api.get('/account/invoices', { query }),
  pdf: (id) => api.download(`/account/invoices/${id}/pdf`),
};

// ── Lots on hold after a Custodian objection (D-140) ────────────────
export const objections = {
  mine: () => api.get(`${APP}/me/lots-on-hold`),
  acknowledge: (id) => api.post(`${APP}/objections/${id}/acknowledge`).then(invalidateMe),
  submitFix: (id, note) => api.post(`${APP}/objections/${id}/submit-fix`, { note }).then(invalidateMe),
  correct: (listingId, payload) => api.post(`${APP}/listings/${listingId}/correct`, payload),
  removeMedia: (listingId, mediaId) => api.post(`${APP}/listings/${listingId}/media/${mediaId}/remove`),
};

// ── TSX subscription plans (D-138) ──────────────────────────────────
export const plans = {
  list: () => api.get(`${APP}/plans`, { auth: false }),
};

// ── Published legal & help documents (D-137) ────────────────────────
export const legalDocs = {
  get: (slug) => api.get(`${APP}/legal/${slug}`, { auth: false }),
  accept: (slugs) => api.post(`${APP}/me/accept-documents`, { slugs }),
};

// ── Public info & legal content ─────────────────────────────────────
export const content = {
  terms: () => api.get('/terms', { auth: false }),
  privacy: () => api.get('/privacy', { auth: false }),
  grievanceRedressal: () => api.get('/grievance-redressal', { auth: false }),
  refundCancellation: () => api.get('/refund-cancellation', { auth: false }),
  disputeResolution: () => api.get('/dispute-resolution', { auth: false }),
  cookiePolicy: () => api.get('/cookie-policy', { auth: false }),
  faq: () => api.get('/faq', { auth: false }),
  dosAndDonts: () => api.get('/dos-and-donts', { auth: false }),
  securityTrust: () => api.get('/security-trust', { auth: false }),
  feeSchedule: () => api.get('/fees', { auth: false }),
  pricing: () => api.get('/pricing', { auth: false }),
  terminology: () => api.get('/terminology', { auth: false }),
  trustSupport: () => api.get('/trust-support', { auth: false }),
};

// ── Tenant machine API (BR-62-66, OAuth2 client credentials) ────────
// Included for completeness; the React app does not normally call these.
export const tenantApi = {
  issueToken: (payload) => api.post('/api/v1/oauth/token', payload, { auth: false }),
  preAuditListing: (payload) => api.post('/api/v1/listings/pre-audit', payload),
  pushListing: (payload) => api.post('/api/v1/listings', payload),
  getListing: (id) => api.get(`/api/v1/listings/${id}`),
  pushSaleEvent: (id, payload) => api.post(`/api/v1/listings/${id}/sale-events`, payload),
  getSaleEvent: (id) => api.get(`/api/v1/sale-events/${id}`),
};

export default {
  auth, adminAuth, listings, saleEvents, settlements, disputes, me, account, kyc,
  tenants, sellerApplications, admin, tender, discovery, lotReach, chronicle,
  invoices, content, tenantApi,
};
