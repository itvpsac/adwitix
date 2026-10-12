
export const ROLES = {
  TRADER: 'trader',
  MARKET_MAKER: 'mkt_maker',
  TSX_MASTER: 'tsx_master',
  CUSTODIAN: 'custodian',
};

export const NAVIGATION_CONFIG = [
  {
    label: 'Marketplace',
    to: '/marketplace',
    roles: [ROLES.TRADER, ROLES.MARKET_MAKER, ROLES.TSX_MASTER, ROLES.CUSTODIAN],
  },
  {
    label: 'Buyer',
    to: '/buyer/dashboard',
    roles: [ROLES.TRADER],
    items: [
      { label: 'Trader Dashboard', to: '/buyer/dashboard' },
      { label: 'Saved Searches', to: '/saved-searches' },
      { label: 'Rating History', to: '/rating-history' },
    ],
  },
  {
    label: 'Seller',
    to: '/seller/dashboard',
    roles: [ROLES.MARKET_MAKER],
    items: [
      { label: 'Market Maker Dashboard', to: '/seller/dashboard' },
      { label: 'Create a Lot', to: '/create-lot' },
      { label: 'Apply to Sell', to: '/apply-to-sell' },
      { label: 'Lot Directory', to: '/lot-directory' },
      { label: 'Lot Chronicle', to: '/lot-chronicle' },
    ],
  },
  {
    label: 'Admin',
    to: '/tenant-admin/dashboard',
    roles: [ROLES.TSX_MASTER, ROLES.CUSTODIAN],
    items: [
      { label: 'Tenant Admin Dashboard', to: '/tenant-admin/dashboard' },
      { label: 'Lot Approval', to: '/lot-approval' },
      { label: 'Trading Session Directory', to: '/trading-session-directory' },
      { label: 'Custodian Dashboard', to: '/custodian/dashboard' },
      { label: 'KYC Queue', to: '/kyc-queue' },
      { label: 'Audit Ledger', to: '/audit-ledger' },
      { label: 'Alerts', to: '/alerts' },
    ],
  },
];

export function getFilteredRoutes(userRole) {
  return NAVIGATION_CONFIG.filter((item) => item.roles.includes(userRole));
}
