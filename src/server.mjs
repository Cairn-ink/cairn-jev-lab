import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { evaluate } from './jev.mjs';
import { buildRequest, decide, policy, previewPolicy } from './gate.mjs';

const root = new URL('../', import.meta.url);
const assets = new Map([
  ['/', ['web/index.html', 'text/html; charset=utf-8']],
  ['/i18n.js', ['web/i18n.js', 'text/javascript; charset=utf-8']],
  ['/app.js', ['web/app.js', 'text/javascript; charset=utf-8']],
  ['/dashboard.js', ['web/dashboard.js', 'text/javascript; charset=utf-8']],
  ['/study.json', ['web/study.json', 'application/json; charset=utf-8']],
  ['/examples.json', ['web/examples.json', 'application/json; charset=utf-8']],
  ['/fonts/eb-garamond.ttf', ['web/fonts/eb-garamond.ttf', 'font/ttf']],
  ['/fonts/inter.ttf', ['web/fonts/inter.ttf', 'font/ttf']],
  ['/style.css', ['web/style.css', 'text/css; charset=utf-8']],
  ['/og-image.png', ['web/og-image.png', 'image/png']],
  ['/icon.png', ['web/icon.png', 'image/png']]
]);
const errorCode = error => /^(invalid_case|invalid_answers|network_or_timeout|invalid_provider_response|provider_http_\d{3})$/.test(error.message)
  ? error.message : 'evaluation_failed';
const compare = result => ({ ...result, policies: [policy, previewPolicy],
  decisions: Object.fromEntries([policy, previewPolicy].map(p => [p.version, decide(result.answers, p)])) });

export async function createLabServer({ apiKey = process.env.TYPESAFE_API_KEY, model = process.env.JEV_MODEL || 'jev-1.13.0',
  evaluator = evaluate, maxCalls = 20 } = {}) {
  const recorded = JSON.parse(await readFile(new URL('evidence/holdout-en-v1/report.json', root), 'utf8'));
  const token = randomBytes(24).toString('hex');
  let attempted = 0, busy = false;
  const configured = Boolean(apiKey && apiKey !== 'replace_locally');
  const examples = [['h01', 'Lasting preference'], ['h13', 'Proposal vs. decision'],
    ['h19', 'Missing context'], ['h11', 'A case it struggled with']].map(([id, label]) => {
      const item = recorded.results.find(r => r.id === id);
      return { label, ...compare(item), mode: 'recorded', recordedAt: recorded.startedAt };
    });
  const server = createServer(async (req, res) => {
    const address = server.address();
    const host = `127.0.0.1:${address.port}`;
    const origin = `http://${host}`;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    const json = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)); };
    try {
      if (req.headers.host !== host || (req.headers.origin && req.headers.origin !== origin) ||
          req.headers['sec-fetch-site'] === 'cross-site') return json(403, { error: 'local_origin_required' });
      if (req.method === 'GET' && req.url === '/api/status')
        return json(200, { configured, model, token, attempted, remaining: Math.max(0, maxCalls - attempted), maxCalls });
      if (req.method === 'GET' && req.url === '/api/examples') return json(200, examples);
      // Static pages ignore query strings such as ?lang=zh-TW; API routes above still match exactly.
      const pathname = req.url.split('?')[0];
      if (req.method === 'GET' && assets.has(pathname)) {
        const [file, type] = assets.get(pathname);
        const body = await readFile(new URL(file, root));
        res.writeHead(200, { 'Content-Type': type }); return res.end(body);
      }
      if (req.method !== 'POST' || req.url !== '/api/evaluate') return json(404, { error: 'not_found' });
      if (req.headers.origin !== origin || req.headers['x-lab-token'] !== token ||
          req.headers['content-type'] !== 'application/json') return json(403, { error: 'local_origin_required' });
      if (!configured) return json(503, { error: 'missing_api_key' });
      if (busy) return json(409, { error: 'evaluation_in_progress' });
      if (attempted >= maxCalls) return json(429, { error: 'session_limit_reached' });
      let size = 0;
      const chunks = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 24000) return json(413, { error: 'input_too_large' });
        chunks.push(chunk);
      }
      let input;
      try {
        input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (!input || typeof input !== 'object' || Array.isArray(input) ||
            Object.keys(input).some(key => !['source', 'candidate'].includes(key))) throw new Error();
        buildRequest(input, model);
      } catch { return json(400, { error: 'invalid_case' }); }
      // Recheck after asynchronously reading the body: two concurrent bodies must not bypass the cap.
      if (busy) return json(409, { error: 'evaluation_in_progress' });
      if (attempted >= maxCalls) return json(429, { error: 'session_limit_reached' });
      busy = true; attempted++;
      try {
        const result = await evaluator(input, { apiKey, model });
        return json(200, { ...compare({ ...input, ...result }), mode: 'live', evaluatedAt: new Date().toISOString(),
          remaining: maxCalls - attempted });
      } catch (error) { return json(502, { error: errorCode(error), remaining: maxCalls - attempted }); }
      finally { busy = false; }
    } catch { if (!res.headersSent) json(500, { error: 'server_error' }); else res.end(); }
  });
  server.requestTimeout = 35000;
  server.headersTimeout = 10000;
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 4175);
  if (!Number.isSafeInteger(port) || port < 1024 || port > 65535) throw new Error('invalid_port');
  const server = await createLabServer();
  server.on('error', () => { console.error('server_start_failed'); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`Cairn Jev Lab: http://127.0.0.1:${port} (local only; max 20 live calls per process)`));
}
