import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';

const app = new Hono();

app.get('/healthz', (c) =>
  c.json({ ok: true, service: 'pepcc', ts: new Date().toISOString() }),
);

// API routes (auth, data, /api/events SSE, /api/coach) land in Phase 2.
app.get('/api/ping', (c) => c.json({ pong: true }));

// Serve the built React client in production.
app.use('/*', serveStatic({ root: './dist/client' }));
app.get('/*', serveStatic({ path: './dist/client/index.html' }));

const port = Number(process.env.PORT) || 8080;
serve({ fetch: app.fetch, port }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`pepcc server listening on :${info.port}`);
});
