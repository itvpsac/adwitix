import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API route for proxying admin data
  app.use(express.json());

  app.all("/api/v1/*", async (req, res) => {
    try {
      const url = `https://admin.adwitix.com${req.originalUrl}`;
      console.log(`Proxying request: ${req.method} ${req.originalUrl} to ${url}`);
      console.log(`Request body: ${JSON.stringify(req.body)}`);
      const options: any = {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      if (req.headers.authorization) {
        options.headers['Authorization'] = req.headers.authorization;
      }
      if (req.method !== 'GET') {
        options.body = JSON.stringify(req.body);
      }
      const response = await fetch(url, options);
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error("Error proxying admin request:", error);
      res.status(500).json({ error: "Failed to proxy admin request" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
