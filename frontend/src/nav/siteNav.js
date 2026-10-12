// Navigation grouped by user role and functional area.

export const NAV_GROUPS = [
  {
    label: 'Legal & Info',
    items: [
      { label: 'Marketplace', to: '/marketplace' },
      { label: 'TSX-wise Marketplace', to: '/tsx' },
      { label: 'Tenant Branded Marketplace', to: '/tsx/:slug' },
      { label: 'Chronicle Verify', to: '/chronicle-verify' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'FAQ', to: '/faq' },
      { label: 'Terminology', to: '/terminology' },
      { label: 'Dos and Don\'ts', to: '/dos-and-donts' },
      { label: 'Security & Trust', to: '/security-and-trust' },
      { label: 'Trust & Support', to: '/trust-and-support' },
      { label: 'Cookie Policy', to: '/cookie-policy' },
      { label: 'Privacy Policy', to: '/privacy-policy' },
      { label: 'Terms of Usage', to: '/terms-of-usage' },
      { label: 'Terms and Privacy', to: '/terms-and-privacy' },
      { label: 'Refund and Cancellation Policy', to: '/refund-and-cancellation-policy' },
      { label: 'Grievance Redressal Policy', to: '/grievance-redressal-policy' },
      { label: 'Dispute Resolution Process', to: '/dispute-resolution-process' },
    ],
  },
  {
    label: 'Marketplace',
    to: '/marketplace',
  },
  {
    label: 'Buyer',
    to: '/buyer/dashboard',
    items: [
      { label: 'Trader Dashboard', to: '/buyer/dashboard' },
      { label: 'Lot Directory', to: '/lot-directory' },
      { label: 'Lot Reach & Interest', to: '/lot-reach-and-interest' },
      { label: 'Saved Searches', to: '/saved-searches' },
      { label: 'Rating History', to: '/rating-history' },
      { label: 'Dispute Center', to: '/dispute-center' },
      { label: 'Rating & Reviews', to: '/rating-reviews' },
    ],
  },
  {
    label: 'Seller',
    to: '/seller/dashboard',
    items: [
      { label: 'Market Maker Dashboard', to: '/seller/dashboard' },
      { label: 'Create a Lot', to: '/create-lot' },
      { label: 'Apply to Sell', to: '/apply-to-sell' },
      { label: 'Lot Chronicle', to: '/lot-chronicle' },
      { label: 'Dispute Center', to: '/dispute-center' },
      { label: 'Rating & Reviews', to: '/rating-reviews' },
    ],
  },
  {
    label: 'Admin',
    to: '/tenant-admin/dashboard',
    items: [
      { label: 'Tenant Admin Dashboard', to: '/tenant-admin/dashboard' },
      { label: 'Lot Approval', to: '/lot-approval' },
      { label: 'Trading Session Directory', to: '/trading-session-directory' },
      { label: 'Rules & Specifications', to: '/rules-and-specifications' },
      { label: 'Tenant Invoices', to: '/tenant/invoices' },
      { label: 'Dispute Center', to: '/dispute-center' },
      { label: 'Rating & Reviews', to: '/rating-reviews' },
    ],
  },
];
