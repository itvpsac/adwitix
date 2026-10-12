// Access Matrix configuration based on the provided Screen Access Matrix.
// Roles: 'trader', 'mkt_maker', 'tsx_master', 'custodian'
// Access: 'Y' = full, 'L' = limited, 'N' = no access

export const ACCESS_MATRIX = {
  // Public
  '/marketplace': { trader: 'Y', mkt_maker: 'Y', tsx_master: 'Y', custodian: 'Y', public: 'Y' },
  '/lot-directory': { trader: 'Y', mkt_maker: 'N', tsx_master: 'N', custodian: 'N', public: 'Y' },
  
  // Buyer (Trader)
  '/buyer/dashboard': { trader: 'Y', mkt_maker: 'N', tsx_master: 'N', custodian: 'N' },
  '/lot-detail': { trader: 'Y', mkt_maker: 'L', tsx_master: 'L', custodian: 'L' },
  '/bidding-room': { trader: 'L', mkt_maker: 'N', tsx_master: 'N', custodian: 'N' },
  '/lot-reach-and-interest': { trader: 'Y', mkt_maker: 'L', tsx_master: 'N', custodian: 'N' },
  '/saved-searches': { trader: 'Y', mkt_maker: 'N', tsx_master: 'N', custodian: 'N' },
  '/rating-history': { trader: 'Y', mkt_maker: 'Y', tsx_master: 'N', custodian: 'N' },

  // Seller (Market Maker)
  '/seller/dashboard': { trader: 'N', mkt_maker: 'Y', tsx_master: 'N', custodian: 'N' },
  '/create-lot': { trader: 'N', mkt_maker: 'Y', tsx_master: 'N', custodian: 'N' },
  '/apply-to-sell': { trader: 'Y', mkt_maker: 'N', tsx_master: 'N', custodian: 'N' },
  '/lot-chronicle': { trader: 'L', mkt_maker: 'Y', tsx_master: 'L', custodian: 'L' },

  // Tenant Admin (TSX Master)
  '/tenant-admin/dashboard': { trader: 'N', mkt_maker: 'N', tsx_master: 'Y', custodian: 'N' },
  '/lot-approval': { trader: 'N', mkt_maker: 'N', tsx_master: 'Y', custodian: 'N' },
  '/trading-session-directory': { trader: 'N', mkt_maker: 'N', tsx_master: 'Y', custodian: 'L' },
  
  // Custodian
  '/custodian/dashboard': { trader: 'N', mkt_maker: 'N', tsx_master: 'N', custodian: 'Y' },
  '/kyc-queue': { trader: 'N', mkt_maker: 'N', tsx_master: 'N', custodian: 'Y' },
  '/audit-ledger': { trader: 'N', mkt_maker: 'N', tsx_master: 'N', custodian: 'Y' },
  '/alerts': { trader: 'N', mkt_maker: 'N', tsx_master: 'N', custodian: 'Y' },
};

export function canAccess(role, path) {
  const rules = ACCESS_MATRIX[path];
  // If no rules defined, default to false for restricted areas to be safe
  if (!rules) return false; 
  const access = rules[role];
  return access === 'Y' || access === 'L';
}
