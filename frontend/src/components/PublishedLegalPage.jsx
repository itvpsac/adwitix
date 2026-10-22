import LegalPage from './LegalPage.jsx';
import { usePublishedContent } from '../utils/publishedContent.js';

// A legal document page (Terms, Privacy, Cookies, …) as published by the
// Custodian (D-137). The page's own built-in JSX is version 1 and shows
// until a published version loads; the published version is the same
// LegalPage layout filled from stored, server-sanitised HTML.
const Html = ({ html, as: Tag = 'div' }) => <Tag dangerouslySetInnerHTML={{ __html: html || '' }} />;

export default function PublishedLegalPage({ slug, children }) {
  const c = usePublishedContent(slug, null);
  if (!c || !Array.isArray(c.sections)) return children;
  return (
    <LegalPage
      eyebrow={c.eyebrow ?? 'Legal'}
      title={c.title}
      meta={c.meta ? <Html as="span" html={c.meta} /> : null}
      intro={c.intro ? <Html as="span" html={c.intro} /> : null}
      sections={c.sections.map((s) => ({ id: s.id, title: s.title, body: <Html html={s.body} /> }))}
      toc={!!c.toc}
      maxWidth={c.maxWidth || 760}
      footerNote={c.footer ? <Html as="span" html={c.footer} /> : null}
      backTo={c.backTo || '/trust-and-support'}
    />
  );
}
