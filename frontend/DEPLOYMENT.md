# Deploying to a static host / your own server

This is a client-side-routed SPA (React Router) — every path like
`/custodian/login` only exists in JS, not as a real file. A hard
refresh on such a path asks the *web server* for that file directly;
without a rewrite rule the server 404s before React ever loads.

Fix: make the server serve `index.html` for any path it doesn't
recognize as a real static file, and let React Router take over from
there. Config for each host is already included:

- **Netlify** — `public/_redirects` (copied into `dist/` on build)
- **Vercel** — `vercel.json` at the project root
- **Apache** — `public/.htaccess` (copied into `dist/` on build; needs `mod_rewrite`)
- **Nginx** — add to your server block:
  ```
  location / {
    try_files $uri $uri/ /index.html;
  }
  ```
- **IIS** — add a `web.config` with a URL Rewrite rule to the same effect (ask if you need one generated).
- **Node/Express static serving** — use a fallback middleware, e.g. `app.get('*', (req, res) => res.sendFile(path.join(distDir, 'index.html')))`, registered after your static asset middleware.

No app code changes were needed — this is entirely server/hosting
configuration.
