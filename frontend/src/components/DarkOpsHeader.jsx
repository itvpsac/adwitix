import AppHeader from './AppHeader.jsx';

// Kept for API compatibility — ops pages render the shared header.
export default function DarkOpsHeader({ navItems = [], maxWidth = '100%' }) {
  return <AppHeader variant="dark" contextNav={navItems} maxWidth={maxWidth} />;
}
