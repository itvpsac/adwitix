import { ProtectedRoute } from './ProtectedRoute.jsx';
// Central route table. Add one entry per converted screen as batches land.
import HomeRoute from './HomeRoute.jsx';
import ConsoleFrame from './components/custodian/ConsoleFrame.jsx';
import CustodianLogin from './pages/custodian/CustodianLogin.jsx';
import CustodianForgotPassword from './pages/custodian/CustodianForgotPassword.jsx';
import CustodianForgotMpin from './pages/custodian/CustodianForgotMpin.jsx';
import CustodianDashboard from './pages/custodian/CustodianDashboard.jsx';
import CustodianDecisions from './pages/custodian/CustodianDecisions.jsx';
import CustodianTenants from './pages/custodian/CustodianTenants.jsx';
import CookiePolicy from './pages/legal/CookiePolicy.jsx';
import GrievanceRedressalPolicy from './pages/legal/GrievanceRedressalPolicy.jsx';
import RefundAndCancellationPolicy from './pages/legal/RefundAndCancellationPolicy.jsx';
import TermsOfUsage from './pages/legal/TermsOfUsage.jsx';
import PrivacyPolicy from './pages/legal/PrivacyPolicy.jsx';
import DisputeResolutionProcess from './pages/legal/DisputeResolutionProcess.jsx';
import TermsAndPrivacy from './pages/legal/TermsAndPrivacy.jsx';
import StarRatings from './pages/legal/StarRatings.jsx';
import SecurityAndTrust from './pages/legal/SecurityAndTrust.jsx';
import DosAndDonts from './pages/legal/DosAndDonts.jsx';
import Terminology from './pages/legal/Terminology.jsx';
import FAQ from './pages/legal/FAQ.jsx';
import TrustAndSupport from './pages/legal/TrustAndSupport.jsx';
import DefectDisclosure from './pages/legal/DefectDisclosure.jsx';
import Pricing from './pages/legal/Pricing.jsx';
import Marketplace from './pages/marketplace/Marketplace.jsx';
import LotDetail from './pages/marketplace/LotDetail.jsx';
import LotDirectory from './pages/lots/LotDirectory.jsx';
import ApplyToSell from './pages/lots/ApplyToSell.jsx';
import CreateLot from './pages/lots/CreateLot.jsx';
import LotApproval from './pages/lots/LotApproval.jsx';
import LotChronicle from './pages/lots/LotChronicle.jsx';
import LotReachInterest from './pages/lots/LotReachInterest.jsx';
import BiddingRoom from './pages/lots/BiddingRoom.jsx';
import BuyerDashboard from './pages/dashboards/BuyerDashboard.jsx';
import SellerDashboard from './pages/dashboards/SellerDashboard.jsx';
import TenantAdminDashboard from './pages/dashboards/TenantAdminDashboard.jsx';
import Profile from './pages/dashboards/Profile.jsx';
import Preferences from './pages/dashboards/Preferences.jsx';
import DisputeCenter from './pages/disputes/DisputeCenter.jsx';
import Settlement from './pages/disputes/Settlement.jsx';
import ChargebackHandling from './pages/disputes/ChargebackHandling.jsx';
import PayoutReviews from './pages/disputes/PayoutReviews.jsx';
import RatingReviews from './pages/disputes/RatingReviews.jsx';
import EmdConsent from './pages/disputes/EmdConsent.jsx';
import AmlMonitoring from './pages/compliance/AmlMonitoring.jsx';
import Alerts from './pages/compliance/Alerts.jsx';
import AuditChainVerify from './pages/compliance/AuditChainVerify.jsx';
import AuditLedger from './pages/compliance/AuditLedger.jsx';
import ConsentAudit from './pages/compliance/ConsentAudit.jsx';
import DelistMarketMaker from './pages/compliance/DelistMarketMaker.jsx';
import MediaWaivers from './pages/compliance/MediaWaivers.jsx';
import RulesAndSpecifications from './pages/compliance/RulesAndSpecifications.jsx';
import StatutoryExport from './pages/compliance/StatutoryExport.jsx';
import WhitelistTenant from './pages/compliance/WhitelistTenant.jsx';
import ChangeMpin from './pages/account/ChangeMpin.jsx';
import DeleteAccount from './pages/account/DeleteAccount.jsx';
import PayoutBank from './pages/account/PayoutBank.jsx';
import RatingHistory from './pages/account/RatingHistory.jsx';
import SavedSearches from './pages/account/SavedSearches.jsx';
import ActivityLog from './pages/account/ActivityLog.jsx';
import Kyc from './pages/onboarding/Kyc.jsx';
import Onboarding from './pages/onboarding/Onboarding.jsx';
import ForgotMpin from './pages/onboarding/ForgotMpin.jsx';
import KycQueue from './pages/compliance/KycQueue.jsx';
import CustodianCredentialSetup from './pages/custodian/CustodianCredentialSetup.jsx';
import TenantDirectory from './pages/lots/TenantDirectory.jsx';
import TradingSessionDirectory from './pages/directories/TradingSessionDirectory.jsx';
import UserDetail from './pages/directories/UserDetail.jsx';
import UserDirectory from './pages/directories/UserDirectory.jsx';
import TenderAuctionReport from './pages/tender/TenderAuctionReport.jsx';
import TenderConciergeConsole from './pages/tender/TenderConciergeConsole.jsx';
import TenderEligibility from './pages/tender/TenderEligibility.jsx';
import TenderStakeholderView from './pages/tender/TenderStakeholderView.jsx';
import AxChronicle from './pages/chronicle/AxChronicle.jsx';
import ChronicleVerify from './pages/chronicle/ChronicleVerify.jsx';
import Invoices from './pages/compliance/Invoices.jsx';

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
  { path: '/user-detail', element: <ProtectedRoute requiredRole="super_admin"><UserDetail /></ProtectedRoute> },
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
