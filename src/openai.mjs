import { questions } from './gate.mjs';
import { gateMessages as originalGateMessages, readerMessages as originalReaderMessages } from './comparison.mjs';

export const model = 'gpt-5.6-luna';
const endpoint = 'https://api.openai.com/v1/chat/completions';
const object = properties => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
const probability = { type: 'number', minimum: 0, maximum: 1 };
const format = (name, schema) => ({ type: 'json_schema', json_schema: { name, strict: true, schema } });
export const gateFormat = format('memory_judgments', object({ answers: object(Object.fromEntries(
  Object.entries(questions).map(([name, q]) => [name, object({
    type: { type: 'string', enum: ['choice'] }, choice: { type: 'string', enum: Object.keys(q.criteria) },
    confidence: probability, probabilities: object(Object.fromEntries(Object.keys(q.criteria).map(k => [k, probability])))
  })])
)) }));
export const readerFormat = options => format('memory_followup', object({ answer: { type: 'string', enum: options } }));
const withoutQwenMarker = messages => messages.map(m => ({ ...m, content: m.content.replace(/ \/no_think$/, '') }));
export const gateMessages = item => withoutQwenMarker(originalGateMessages(item));
export const readerMessages = (probe, memories) => withoutQwenMarker(originalReaderMessages(probe, memories));

export function requestBody(messages, responseFormat, maxTokens) {
  if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > 700 || responseFormat?.type !== 'json_schema')
    throw new Error('invalid_openai_config');
  return { model, messages, response_format: responseFormat, reasoning_effort: 'none', temperature: 0,
    max_completion_tokens: maxTokens, stream: false, store: false };
}

export async function complete(messages, { apiKey, responseFormat = gateFormat, maxTokens = 700, fetchImpl = fetch } = {}) {
  if (!apiKey || apiKey === 'replace_locally') throw new Error('missing_openai_key');
  const body = JSON.stringify(requestBody(messages, responseFormat, maxTokens));
  if (Buffer.byteLength(body) > 32768) throw new Error('invalid_openai_config');
  const started = performance.now();
  let response;
  try {
    response = await fetchImpl(endpoint, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(60000),
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body });
  } catch { throw new Error('openai_network_or_timeout'); }
  if (!response.ok) { await response.body?.cancel(); throw new Error(`openai_http_${response.status}`); }
  let data;
  try {
    const reader = response.body.getReader(), chunks = []; let size = 0;
    try { for (;;) { const { value, done } = await reader.read(); if (done) break; size += value.byteLength;
      if (size > 1000000) throw new Error('oversized'); chunks.push(value); }
      data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } finally { await reader.cancel().catch(() => {}); }
  } catch { throw new Error('invalid_openai_response'); }
  const choice = data.choices?.[0], content = choice?.message?.content;
  if (choice?.finish_reason !== 'stop' || choice?.message?.refusal || typeof content !== 'string' || content.length > 12000)
    throw new Error('invalid_openai_response');
  const safeName = value => typeof value === 'string' && /^[a-zA-Z0-9._/-]{1,120}$/.test(value) ? value : 'unreported';
  const count = value => Number.isSafeInteger(value) && value >= 0 ? value : null;
  return { content, model: safeName(data.model), provider: 'OpenAI', latencyMs: Math.round(performance.now() - started),
    usage: { input_tokens: count(data.usage?.prompt_tokens), output_tokens: count(data.usage?.completion_tokens),
      cached_input_tokens: count(data.usage?.prompt_tokens_details?.cached_tokens),
      reasoning_tokens: count(data.usage?.completion_tokens_details?.reasoning_tokens), reportedCostUsd: null } };
}
