import AppHeader from './AppHeader.jsx';

// Kept for API compatibility — legal/info pages render the shared header with a back link.
export default function PublicMiniHeader({ backTo = '/trust-and-support', backLabel = 'Trust & Support', dark = false, maxWidth = '100%' }) {
  return <AppHeader variant={dark ? 'dark' : 'light'} backTo={backTo} backLabel={backLabel} maxWidth={maxWidth} />;
}
