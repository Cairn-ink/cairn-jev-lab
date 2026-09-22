const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
export async function complete(messages, { apiKey, model = 'qwen/qwen3-8b', maxTokens = 700, fetchImpl = fetch } = {}) {
  if (!apiKey || apiKey === 'replace_locally') throw new Error('missing_llm_key');
  if (!/^[a-zA-Z0-9._:/-]{1,120}$/.test(model) || !Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > 700)
    throw new Error('invalid_llm_config');
  const started = performance.now();
  let response;
  try {
    response = await fetchImpl(endpoint, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(60000),
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, temperature: 0, max_tokens: maxTokens, stream: false,
        response_format: { type: 'json_object' }, provider: { allow_fallbacks: false, data_collection: 'deny', max_price: { prompt: 1, completion: 2 } } }) });
  } catch { throw new Error('llm_network_or_timeout'); }
  if (!response.ok) { await response.body?.cancel(); throw new Error(`llm_http_${response.status}`); }
  let data;
  try {
    const reader = response.body.getReader(), chunks = []; let size = 0;
    try { for (;;) { const { value, done } = await reader.read(); if (done) break; size += value.byteLength;
      if (size > 1000000) throw new Error('oversized'); chunks.push(value); }
      data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } finally { await reader.cancel().catch(() => {}); }
  } catch { throw new Error('invalid_llm_response'); }
  const content = data.choices?.[0]?.message?.content;
  if (data.choices?.[0]?.finish_reason !== 'stop' || typeof content !== 'string' || content.length > 12000) throw new Error('invalid_llm_response');
  const safeName = value => typeof value === 'string' && /^[a-zA-Z0-9 ._:/()-]{1,120}$/.test(value) ? value : 'unreported';
  return { content, model: safeName(data.model), provider: safeName(data.provider),
    latencyMs: Math.round(performance.now() - started), usage: {
      input_tokens: Number.isSafeInteger(data.usage?.prompt_tokens) ? data.usage.prompt_tokens : null,
      output_tokens: Number.isSafeInteger(data.usage?.completion_tokens) ? data.usage.completion_tokens : null,
      reportedCostUsd: Number.isFinite(data.usage?.cost) && data.usage.cost >= 0 ? data.usage.cost : null } };
}
