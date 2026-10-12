import AppHeader from './AppHeader.jsx';

// Kept for API compatibility — internal role dashboards render the shared header.
export default function DashboardHeader({ consoleLabel, homeTo = '/', navItems = [], ctas = [] }) {
  return <AppHeader variant="dark" homeTo={homeTo} contextLabel={consoleLabel} contextNav={navItems} ctas={ctas} />;
}
