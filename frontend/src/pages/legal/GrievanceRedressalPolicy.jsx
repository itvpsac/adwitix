import LegalPage from '../../components/LegalPage.jsx';

export default function GrievanceRedressalPolicy() {
  const sections = [
    { id: 's1', title: '1. Purpose & Scope', body: (
      <>
        <p>1.1. This Policy sets out how to raise a grievance about ADWITIX as a platform — distinct from a dispute about a specific Trading Session, which is handled under our separate Dispute Resolution Process.</p>
        <p>1.2. A grievance may relate to matters such as: how your data has been handled, conduct by a TSX Master or platform staff, a concern about how a rule was applied to you, or dissatisfaction with the outcome of a prior support interaction.</p>
      </>
    )},
    { id: 's2', title: '2. Grievance Officer', body: <p>In accordance with the Information Technology Act 2000 and the rules made thereunder, the details of our Grievance Officer are available via our <a href="/trust-and-support">Contact Us</a> page.</p> },
    { id: 's3', title: '3. How to File a Grievance', body: (
      <>
        <p>3.1. A grievance may be submitted in writing, through the contact channel published on the Trust &amp; Support section of the app, or directly to the Grievance Officer.</p>
        <p>3.2. Please include: your registered mobile number, a description of the issue, and any relevant transaction or Lot reference.</p>
      </>
    )},
    { id: 's4', title: '4. Acknowledgement & Resolution Timelines', body: <p>4.1. Grievances are acknowledged within 24 hours of receipt, and are resolved, or a substantive response provided, within 15 days.</p> },
    { id: 's5', title: '5. Escalation Path', body: (
      <>
        <p>5.1. Most day-to-day concerns are resolved directly by your TradeSphereX's support team or TSX Master.</p>
        <p>5.2. If unresolved, or if the concern relates to Custodian-level conduct, it is escalated to the Custodian.</p>
        <p>5.3. If still unresolved, or if you are dissatisfied with the response, you may escalate directly to the Grievance Officer named in Section 2.</p>
      </>
    )},
    { id: 's6', title: '6. Your Right to External Recourse', body: <p>6.1. Nothing in this Policy limits your right to approach a Consumer Disputes Redressal Commission, another applicable regulatory authority, or a court of competent jurisdiction, at any time.</p> },
  ];
  return (
    <LegalPage eyebrow="Legal" title="Grievance Redressal Policy" meta={<>Adwiti Technocrats Pvt. Ltd · Effective Date: 15-September-2026 · Contact: <a href="/trust-and-support">Contact Us</a></>}
      sections={sections} maxWidth={760}
      footerNote={<>See also our <a href="/dispute-resolution-process">Dispute Resolution Process</a>.</>} />
  );
}
