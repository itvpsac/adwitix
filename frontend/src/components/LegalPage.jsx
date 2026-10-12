import PublicMiniHeader from './PublicMiniHeader.jsx';
import './LegalPage.css';

// Shared layout for legal/policy/plain-language docs.
// sections: [{ id, title, body: ReactNode }]; toc renders a sticky side nav when true.
export default function LegalPage({ eyebrow = 'Legal', title, meta, intro, sections, toc = false, footerNote, maxWidth = 760, backTo = '/trust-and-support', backLabel = 'Trust & Support' }) {
  return (
    <div className="legal-page">
      <PublicMiniHeader backTo={backTo} backLabel={backLabel} />
      <main className="legal-main" style={{ maxWidth }}>
        <div className="legal-eyebrow">{eyebrow}</div>
        <h1 className="legal-title">{title}</h1>
        {meta && <p className="legal-meta">{meta}</p>}
        {intro && <p className="legal-intro">{intro}</p>}

        {toc ? (
          <div className="legal-layout">
            <nav className="legal-toc">
              {sections.map((s) => <a key={s.id} href={`#${s.id}`}>{s.title.replace(/^\d+\.\s*/, '')}</a>)}
            </nav>
            <div className="legal-sections">
              {sections.map((s) => (
                <section key={s.id} id={s.id}>
                  <h2>{s.title}</h2>
                  <div className="legal-body">{s.body}</div>
                </section>
              ))}
            </div>
          </div>
        ) : (
          <div className="legal-sections legal-sections--stacked">
            {sections.map((s) => (
              <section key={s.id} id={s.id}>
                <h2>{s.title}</h2>
                <div className="legal-body">{s.body}</div>
              </section>
            ))}
          </div>
        )}
      </main>
      {footerNote && (
        <footer className="legal-footer"><p>{footerNote}</p></footer>
      )}
    </div>
  );
}
