import express from 'express';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { onRequest } from './functions/api/[[route]].js';

const app = express();
const PORT = 3000;

// Parse json and urlencoded payloads up to 50MB for attachment support
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize persistent SQLite database
const dbPath = path.join(process.cwd(), 'vault.db');
const db = new DatabaseSync(dbPath);

// D1 Database Adapter for Cloudflare D1 compatibility
const d1 = {
  async exec(sql) {
    db.exec(sql);
  },
  prepare(sql) {
    return {
      bind(...args) {
        return {
          async all() {
            const stmt = db.prepare(sql);
            return { results: stmt.all(...args) };
          },
          async run() {
            const stmt = db.prepare(sql);
            const res = stmt.run(...args);
            return {
              meta: {
                last_row_id: Number(res.lastInsertRowid),
                changes: res.changes,
              },
            };
          },
          async first() {
            const stmt = db.prepare(sql);
            const row = stmt.get(...args);
            return row || null;
          },
        };
      },
      async all() {
        const stmt = db.prepare(sql);
        return { results: stmt.all() };
      },
      async run() {
        const stmt = db.prepare(sql);
        const res = stmt.run();
        return {
          meta: {
            last_row_id: Number(res.lastInsertRowid),
            changes: res.changes,
          },
        };
      },
      async first() {
        const stmt = db.prepare(sql);
        const row = stmt.get();
        return row || null;
      },
    };
  },
};

// API routes handling via Cloudflare Pages function handler
app.all(['/api', '/api/*'], async (req, res) => {
  try {
    const url = `${req.protocol}://${req.get('host') || '0.0.0.0:3000'}${req.originalUrl}`;
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          for (const v of value) headers.append(key, v);
        } else {
          headers.set(key, value);
        }
      }
    }

    const init = {
      method: req.method,
      headers,
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      init.body = JSON.stringify(req.body ?? {});
      headers.set('content-type', 'application/json');
    }

    const webRequest = new Request(url, init);
    const webResponse = await onRequest({
      request: webRequest,
      env: { DB: d1 },
    });

    res.status(webResponse.status);
    for (const [key, val] of webResponse.headers.entries()) {
      res.setHeader(key, val);
    }
    const text = await webResponse.text();
    res.send(text);
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Serve static frontend assets
const publicDir = path.join(process.cwd(), 'public');
app.use(express.static(publicDir));

// Fallback to index.html for SPA behavior
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Vault server listening on http://0.0.0.0:${PORT}`);
});
