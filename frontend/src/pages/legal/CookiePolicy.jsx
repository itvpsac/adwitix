import LegalPage from '../../components/LegalPage.jsx';

export default function CookiePolicy() {
  const sections = [
    { id: 's1', title: '1. What Are Cookies', body: <p>Cookies are small text files placed on your device when you use ADWITIX, used to remember information about your visit.</p> },
    { id: 's2', title: '2. Cookies We Use', body: (
      <table>
        <tr><th>Category</th><th>Purpose</th><th>Can You Opt Out?</th></tr>
        <tr><td>Strictly Necessary / Session</td><td>Keeps you logged in and your session secure while using the Platform.</td><td>No — required for the Platform to function.</td></tr>
        <tr><td>Functional</td><td>Remembers preferences such as your CAT-LOC-VAL discovery filters, so you don't have to reset them each visit.</td><td>Yes, though some convenience features may not work without them.</td></tr>
        <tr><td>Analytics</td><td>Helps us understand how the Platform is used, to improve it over time.</td><td>Yes, where offered.</td></tr>
      </table>
    )},
    { id: 's3', title: '3. What We Do Not Use Cookies For', body: (
      <>
        <p>We do not use cookies to store your banking details, EMD/deposit balance, or KYC documents — this data is held server-side, within our segregated escrow and encrypted storage systems, never in a browser cookie.</p>
        <p>We do not use third-party advertising or ad-retargeting cookies.</p>
      </>
    )},
    { id: 's4', title: '4. Third-Party Cookies', body: <p>4.1. Our Payment Gateway partner may set its own cookies during the payment/checkout process, governed by their own cookie and privacy practices, not this Policy.</p> },
    { id: 's5', title: '5. Managing Your Preferences', body: <p>5.1. Most browsers let you block or delete cookies through their settings. Blocking strictly necessary cookies will prevent you from using core Platform features, including logging in.</p> },
    { id: 's6', title: '6. Changes to This Policy', body: <p>6.1. We may update this Policy as our use of cookies changes. Material changes will be reflected in the "Effective Date" above.</p> },
  ];
  return (
    <LegalPage eyebrow="Legal" title="Cookie Policy" meta={<>Adwiti Technocrats Pvt. Ltd · Effective Date: 15-September-2026 · Contact: <a href="/trust-and-support">Contact Us</a></>}
      sections={sections} maxWidth={760}
      footerNote={<>See also our <a href="/privacy-policy">Privacy Policy</a>.</>} />
  );
}
