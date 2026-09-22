import { evaluate } from './jev.mjs';
import { decide, policy } from './gate.mjs';

/** Evaluate one proposed memory without rewriting it or touching a memory store. */
export async function judgeMemory({ source, candidate }, options = {}) {
  const result = await evaluate({ source, candidate }, options);
  return { source, candidate, ...result, ...decide(result.answers), policy: { ...policy } };
}
