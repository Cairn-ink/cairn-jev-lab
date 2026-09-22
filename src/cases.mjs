import { buildRequest } from './gate.mjs';

/** Normalize documented fields so unexpected metadata is never persisted or transmitted. */
export function parseCases(text) {
  if (Buffer.byteLength(text, 'utf8') > 200000) throw new Error('input_too_large');
  let values;
  try { values = JSON.parse(text); } catch { throw new Error('invalid_json'); }
  if (!Array.isArray(values) || values.length < 1 || values.length > 20) throw new Error('invalid_case_count');
  const ids = new Set();
  return values.map(value => {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        Object.keys(value).some(key => !['id', 'source', 'candidate', 'expected', 'why'].includes(key)) ||
        typeof value.id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(value.id) || ids.has(value.id)) {
      throw new Error('invalid_case');
    }
    buildRequest(value);
    if (Object.hasOwn(value, 'expected') && !['save', 'skip', 'defer'].includes(value.expected))
      throw new Error('invalid_expected');
    if (Object.hasOwn(value, 'why') && (typeof value.why !== 'string' || value.why.length > 1000))
      throw new Error('invalid_why');
    ids.add(value.id);
    return { id: value.id, source: value.source, candidate: value.candidate,
      ...(value.expected === undefined ? {} : { expected: value.expected }),
      ...(value.why === undefined ? {} : { why: value.why }) };
  });
}
