import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';

const app = new Hono();

app.get('/healthz', (c) =>
  c.json({ ok: true, service: 'pepcc', ts: new Date().toISOString() }),
);

// API routes (auth, data, /api/events SSE, /api/coach) land in Phase 2.
app.get('/api/ping', (c) => c.json({ pong: true }));

// v2 React client (Phase 2 work in progress), built with base '/v2/'.
app.use(
  '/v2/*',
  serveStatic({ root: './dist/client', rewriteRequestPath: (p) => p.replace(/^\/v2/, '') }),
);
app.get('/v2/*', serveStatic({ path: './dist/client/index.html' }));

// Phase 1: serve the legacy single-file app (still backed by Supabase) at the
// root. Every legacy file is sent with `Cache-Control: no-cache`, so browsers
// and the service worker always revalidate and a deploy shows up on the next
// load, with no sw.js CACHE_VERSION bump needed.
app.use('/*', async (c, next) => {
  await next();
  if (c.res.status === 200 && !c.req.path.startsWith('/v2') && !c.req.path.startsWith('/api')) {
    c.res.headers.set('Cache-Control', 'no-cache');
  }
});
app.use('/*', serveStatic({ root: process.env.LEGACY_ROOT || './legacy' }));

const port = Number(process.env.PORT) || 8080;
serve({ fetch: app.fetch, port }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`pepcc server listening on :${info.port}`);
});
