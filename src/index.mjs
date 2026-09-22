import { evaluate } from './jev.mjs';
import { decide, getPolicy } from './gate.mjs';

/** Evaluate one proposed memory without rewriting it or touching a memory store. */
export async function judgeMemory({ source, candidate }, options = {}) {
  const policy = getPolicy(options.policyId);
  const result = await evaluate({ source, candidate }, options);
  return { source, candidate, ...result, ...decide(result.answers, policy), policy: { ...policy } };
}
