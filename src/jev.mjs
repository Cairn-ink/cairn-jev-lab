import { buildRequest, validateAnswers } from './gate.mjs';

const endpoint = 'https://api.typesafe.ai/v1/systemone';
export async function evaluate(item, { apiKey, model = 'jev-latest', fetchImpl = fetch } = {}) {
  if (!apiKey || apiKey === 'replace_locally') throw new Error('missing_api_key');
  const request = buildRequest(item, model);
  const started = performance.now();
  let response;
  try {
    response = await fetchImpl(endpoint, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(30000),
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
  } catch { throw new Error('network_or_timeout'); }
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`provider_http_${response.status}`);
  }
  let data;
  try {
    const reader = response.body.getReader();
    const parts = [];
    let size = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 1000000) throw new Error('oversized_response');
        parts.push(value);
      }
      data = JSON.parse(Buffer.concat(parts).toString('utf8'));
    } finally { await reader.cancel().catch(() => {}); }
  } catch { throw new Error('invalid_provider_response'); }
  const answers = validateAnswers(data.answers);
  const usage = {};
  for (const key of ['input_tokens', 'output_tokens']) {
    const n = data.usage?.[key];
    usage[key] = Number.isSafeInteger(n) && n >= 0 ? n : null;
  }
  // Persist only bounded metadata and validated choices; never headers or error bodies.
  const resolvedModel = typeof data.model === 'string' && /^[a-zA-Z0-9._/-]{1,80}$/.test(data.model)
    ? data.model : 'unreported';
  return { model: resolvedModel, answers, usage, latencyMs: Math.round(performance.now() - started) };
}
