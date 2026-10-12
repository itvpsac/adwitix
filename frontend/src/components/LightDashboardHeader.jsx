import AppHeader from './AppHeader.jsx';

// Kept for API compatibility — self-service dashboards render the shared header.
export default function LightDashboardHeader({ homeTo = '/', navItems = [], ctas = [], primaryCta }) {
  return <AppHeader variant="light" homeTo={homeTo} contextNav={navItems} ctas={ctas} primaryCta={primaryCta} />;
}
