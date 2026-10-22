import lazyPage from './lazyPage.js';
import { ProtectedRoute } from './ProtectedRoute.jsx';
// Central route table. Add one entry per converted screen as batches land.
import HomeRoute from './HomeRoute.jsx';
import ConsoleFrame from './components/custodian/ConsoleFrame.jsx';
const CustodianLogin = lazyPage(() => import('./pages/custodian/CustodianLogin.jsx'));
const CustodianForgotPassword = lazyPage(() => import('./pages/custodian/CustodianForgotPassword.jsx'));
const CustodianForgotMpin = lazyPage(() => import('./pages/custodian/CustodianForgotMpin.jsx'));
const CustodianDashboard = lazyPage(() => import('./pages/custodian/CustodianDashboard.jsx'));
const CustodianDecisions = lazyPage(() => import('./pages/custodian/CustodianDecisions.jsx'));
const CustodianTenants = lazyPage(() => import('./pages/custodian/CustodianTenants.jsx'));
const CustodianLot = lazyPage(() => import('./pages/custodian/CustodianLot.jsx'));
const CustodianUser = lazyPage(() => import('./pages/custodian/CustodianUser.jsx'));
const CookiePolicy = lazyPage(() => import('./pages/legal/CookiePolicy.jsx'));
const GrievanceRedressalPolicy = lazyPage(() => import('./pages/legal/GrievanceRedressalPolicy.jsx'));
const RefundAndCancellationPolicy = lazyPage(() => import('./pages/legal/RefundAndCancellationPolicy.jsx'));
const TermsOfUsage = lazyPage(() => import('./pages/legal/TermsOfUsage.jsx'));
const PrivacyPolicy = lazyPage(() => import('./pages/legal/PrivacyPolicy.jsx'));
const DisputeResolutionProcess = lazyPage(() => import('./pages/legal/DisputeResolutionProcess.jsx'));
const TermsAndPrivacy = lazyPage(() => import('./pages/legal/TermsAndPrivacy.jsx'));
const StarRatings = lazyPage(() => import('./pages/legal/StarRatings.jsx'));
const SecurityAndTrust = lazyPage(() => import('./pages/legal/SecurityAndTrust.jsx'));
const DosAndDonts = lazyPage(() => import('./pages/legal/DosAndDonts.jsx'));
const Terminology = lazyPage(() => import('./pages/legal/Terminology.jsx'));
const FAQ = lazyPage(() => import('./pages/legal/FAQ.jsx'));
const TrustAndSupport = lazyPage(() => import('./pages/legal/TrustAndSupport.jsx'));
const DefectDisclosure = lazyPage(() => import('./pages/legal/DefectDisclosure.jsx'));
const Pricing = lazyPage(() => import('./pages/legal/Pricing.jsx'));
const Marketplace = lazyPage(() => import('./pages/marketplace/Marketplace.jsx'));
const LotDetail = lazyPage(() => import('./pages/marketplace/LotDetail.jsx'));
const LotDirectory = lazyPage(() => import('./pages/lots/LotDirectory.jsx'));
const ApplyToSell = lazyPage(() => import('./pages/lots/ApplyToSell.jsx'));
const CreateLot = lazyPage(() => import('./pages/lots/CreateLot.jsx'));
const LotApproval = lazyPage(() => import('./pages/lots/LotApproval.jsx'));
const LotChronicle = lazyPage(() => import('./pages/lots/LotChronicle.jsx'));
const LotReachInterest = lazyPage(() => import('./pages/lots/LotReachInterest.jsx'));
const BiddingRoom = lazyPage(() => import('./pages/lots/BiddingRoom.jsx'));
const BuyerDashboard = lazyPage(() => import('./pages/dashboards/BuyerDashboard.jsx'));
const SellerDashboard = lazyPage(() => import('./pages/dashboards/SellerDashboard.jsx'));
const TenantAdminDashboard = lazyPage(() => import('./pages/dashboards/TenantAdminDashboard.jsx'));
const Profile = lazyPage(() => import('./pages/dashboards/Profile.jsx'));
const Preferences = lazyPage(() => import('./pages/dashboards/Preferences.jsx'));
const DisputeCenter = lazyPage(() => import('./pages/disputes/DisputeCenter.jsx'));
const Settlement = lazyPage(() => import('./pages/disputes/Settlement.jsx'));
const ChargebackHandling = lazyPage(() => import('./pages/disputes/ChargebackHandling.jsx'));
const PayoutReviews = lazyPage(() => import('./pages/disputes/PayoutReviews.jsx'));
const RatingReviews = lazyPage(() => import('./pages/disputes/RatingReviews.jsx'));
const EmdConsent = lazyPage(() => import('./pages/disputes/EmdConsent.jsx'));
const AmlMonitoring = lazyPage(() => import('./pages/compliance/AmlMonitoring.jsx'));
const Alerts = lazyPage(() => import('./pages/compliance/Alerts.jsx'));
const AuditChainVerify = lazyPage(() => import('./pages/compliance/AuditChainVerify.jsx'));
const AuditLedger = lazyPage(() => import('./pages/compliance/AuditLedger.jsx'));
const ConsentAudit = lazyPage(() => import('./pages/compliance/ConsentAudit.jsx'));
const DelistMarketMaker = lazyPage(() => import('./pages/compliance/DelistMarketMaker.jsx'));
const MediaWaivers = lazyPage(() => import('./pages/compliance/MediaWaivers.jsx'));
const RulesAndSpecifications = lazyPage(() => import('./pages/compliance/RulesAndSpecifications.jsx'));
const StatutoryExport = lazyPage(() => import('./pages/compliance/StatutoryExport.jsx'));
const WhitelistTenant = lazyPage(() => import('./pages/compliance/WhitelistTenant.jsx'));
const ChangeMpin = lazyPage(() => import('./pages/account/ChangeMpin.jsx'));
const DeleteAccount = lazyPage(() => import('./pages/account/DeleteAccount.jsx'));
const PayoutBank = lazyPage(() => import('./pages/account/PayoutBank.jsx'));
const RatingHistory = lazyPage(() => import('./pages/account/RatingHistory.jsx'));
const SavedSearches = lazyPage(() => import('./pages/account/SavedSearches.jsx'));
const ActivityLog = lazyPage(() => import('./pages/account/ActivityLog.jsx'));
const Kyc = lazyPage(() => import('./pages/onboarding/Kyc.jsx'));
const Onboarding = lazyPage(() => import('./pages/onboarding/Onboarding.jsx'));
const ForgotMpin = lazyPage(() => import('./pages/onboarding/ForgotMpin.jsx'));
const KycQueue = lazyPage(() => import('./pages/compliance/KycQueue.jsx'));
const CustodianCredentialSetup = lazyPage(() => import('./pages/custodian/CustodianCredentialSetup.jsx'));
const TenantDirectory = lazyPage(() => import('./pages/lots/TenantDirectory.jsx'));
const TradingSessionDirectory = lazyPage(() => import('./pages/directories/TradingSessionDirectory.jsx'));
const UserDirectory = lazyPage(() => import('./pages/directories/UserDirectory.jsx'));
const TenderAuctionReport = lazyPage(() => import('./pages/tender/TenderAuctionReport.jsx'));
const TenderConciergeConsole = lazyPage(() => import('./pages/tender/TenderConciergeConsole.jsx'));
const TenderEligibility = lazyPage(() => import('./pages/tender/TenderEligibility.jsx'));
const TenderStakeholderView = lazyPage(() => import('./pages/tender/TenderStakeholderView.jsx'));
const AxChronicle = lazyPage(() => import('./pages/chronicle/AxChronicle.jsx'));
const ChronicleVerify = lazyPage(() => import('./pages/chronicle/ChronicleVerify.jsx'));
const Invoices = lazyPage(() => import('./pages/compliance/Invoices.jsx'));

export const routes = [
  { path: '/marketplace', element: <ConsoleFrame><Marketplace /></ConsoleFrame> },
  { path: '/lot-detail', element: <ConsoleFrame><LotDetail /></ConsoleFrame> },
  { path: '/lot-directory', element: <ProtectedRoute requiredRole="super_admin"><LotDirectory /></ProtectedRoute> },
  { path: '/apply-to-sell', element: <ApplyToSell /> },
  { path: '/create-lot', element: <CreateLot /> },
  { path: '/lot-approval', element: <LotApproval /> },
  { path: '/lot-chronicle', element: <ConsoleFrame><LotChronicle /></ConsoleFrame> },
  { path: '/lot-reach-and-interest', element: <LotReachInterest /> },
  { path: '/bidding-room', element: <ConsoleFrame><BiddingRoom /></ConsoleFrame> },
  { path: '/buyer/dashboard', element: <BuyerDashboard /> },
  { path: '/seller/dashboard', element: <SellerDashboard /> },
  { path: '/tenant-admin/dashboard', element: <TenantAdminDashboard /> },
  { path: '/profile', element: <Profile /> },
  { path: '/preferences', element: <Preferences /> },
  { path: '/dispute-center', element: <DisputeCenter /> },
  { path: '/settlement', element: <ConsoleFrame><Settlement /></ConsoleFrame> },
  { path: '/chargeback-handling', element: <ProtectedRoute requiredRole="super_admin"><ChargebackHandling /></ProtectedRoute> },
  { path: '/payout-reviews', element: <PayoutReviews /> },
  { path: '/rating-reviews', element: <RatingReviews /> },
  { path: '/emd-consent', element: <EmdConsent /> },
  { path: '/aml-monitoring', element: <ProtectedRoute requiredRole="super_admin"><AmlMonitoring /></ProtectedRoute> },
  { path: '/alerts', element: <ProtectedRoute requiredRole="super_admin"><Alerts /></ProtectedRoute> },
  { path: '/audit-chain-verify', element: <ConsoleFrame><AuditChainVerify /></ConsoleFrame> },
  { path: '/audit-ledger', element: <ProtectedRoute requiredRole="super_admin"><AuditLedger /></ProtectedRoute> },
  { path: '/consent-audit', element: <ProtectedRoute requiredRole="super_admin"><ConsentAudit /></ProtectedRoute> },
  { path: '/delist-market-maker', element: <ProtectedRoute requiredRole="super_admin"><DelistMarketMaker /></ProtectedRoute> },
  { path: '/media-waivers', element: <ProtectedRoute requiredRole="super_admin"><MediaWaivers /></ProtectedRoute> },
  { path: '/rules-and-specifications', element: <ProtectedRoute requiredRole="super_admin"><RulesAndSpecifications /></ProtectedRoute> },
  { path: '/statutory-export', element: <ProtectedRoute requiredRole="super_admin"><StatutoryExport /></ProtectedRoute> },
  { path: '/whitelist-tenant', element: <ProtectedRoute requiredRole="super_admin"><WhitelistTenant /></ProtectedRoute> },
  { path: '/change-mpin', element: <ChangeMpin /> },
  { path: '/delete-account', element: <DeleteAccount /> },
  { path: '/payout-bank', element: <PayoutBank /> },
  { path: '/rating-history', element: <RatingHistory /> },
  { path: '/saved-searches', element: <SavedSearches /> },
  { path: '/activity-log', element: <ActivityLog /> },
  { path: '/kyc', element: <Kyc /> },
  { path: '/onboarding', element: <Onboarding /> },
  { path: '/forgot-mpin', element: <ForgotMpin /> },
  { path: '/kyc-queue', element: <ProtectedRoute requiredRole="super_admin"><KycQueue /></ProtectedRoute> },
  { path: '/custodian-credential-setup', element: <CustodianCredentialSetup /> },
  { path: '/tenant-directory', element: <ConsoleFrame><TenantDirectory /></ConsoleFrame> },
  { path: '/trading-session-directory', element: <ProtectedRoute requiredRole="super_admin"><TradingSessionDirectory /></ProtectedRoute> },
  { path: '/user-detail', element: <ProtectedRoute requiredRole="super_admin"><CustodianUser /></ProtectedRoute> },
  { path: '/user-directory', element: <ProtectedRoute requiredRole="super_admin"><UserDirectory /></ProtectedRoute> },
  { path: '/tender-auction-report', element: <TenderAuctionReport /> },
  { path: '/tender-concierge-console', element: <TenderConciergeConsole /> },
  { path: '/tender-eligibility', element: <TenderEligibility /> },
  { path: '/tender-stakeholder-view', element: <TenderStakeholderView /> },
  { path: '/ax-chronicle', element: <AxChronicle /> },
  { path: '/chronicle-verify', element: <ConsoleFrame><ChronicleVerify /></ConsoleFrame> },
  { path: '/invoices', element: <ProtectedRoute requiredRole="super_admin"><Invoices /></ProtectedRoute> },
  { path: '/', element: <HomeRoute /> },
  { path: '/custodian/login', element: <CustodianLogin /> },
  { path: '/custodian/forgot-password', element: <CustodianForgotPassword /> },
  { path: '/custodian/forgot-mpin', element: <CustodianForgotMpin /> },
  { path: '/custodian/credential-setup', element: <CustodianCredentialSetup /> },
  { path: '/custodian/dashboard', element: <ProtectedRoute requiredRole="super_admin"><CustodianDashboard /></ProtectedRoute> },
  { path: '/custodian/decisions', element: <ProtectedRoute requiredRole="super_admin"><CustodianDecisions /></ProtectedRoute> },
  { path: '/custodian/tenants', element: <ProtectedRoute requiredRole="super_admin"><CustodianTenants /></ProtectedRoute> },
  { path: '/custodian/lot', element: <ProtectedRoute requiredRole="super_admin"><CustodianLot /></ProtectedRoute> },
  { path: '/cookie-policy', element: <CookiePolicy /> },
  { path: '/grievance-redressal-policy', element: <GrievanceRedressalPolicy /> },
  { path: '/refund-and-cancellation-policy', element: <RefundAndCancellationPolicy /> },
  { path: '/terms-of-usage', element: <TermsOfUsage /> },
  { path: '/privacy-policy', element: <PrivacyPolicy /> },
  { path: '/dispute-resolution-process', element: <DisputeResolutionProcess /> },
  { path: '/terms-and-privacy', element: <TermsAndPrivacy /> },
  { path: '/star-ratings', element: <StarRatings /> },
  { path: '/security-and-trust', element: <SecurityAndTrust /> },
  { path: '/dos-and-donts', element: <DosAndDonts /> },
  { path: '/terminology', element: <Terminology /> },
  { path: '/faq', element: <FAQ /> },
  { path: '/trust-and-support', element: <TrustAndSupport /> },
  { path: '/defect-disclosure', element: <DefectDisclosure /> },
  { path: '/pricing', element: <Pricing /> },
];
