export function summarize(results) {
  const valid = results.filter(r => !r.error);
  const labeled = valid.filter(r => r.expected !== undefined);
  const sumTokens = key => valid.length && valid.every(r => Number.isSafeInteger(r.usage?.[key]))
    ? valid.reduce((n, r) => n + r.usage[key], 0) : null;
  return {
    evaluated: valid.length, errors: results.length - valid.length, labeledEvaluated: labeled.length,
    matched: labeled.filter(r => r.decision === r.expected).length,
    expectedSaves: labeled.filter(r => r.expected === 'save').length,
    falseSaves: labeled.filter(r => r.decision === 'save' && r.expected !== 'save').length,
    missedSaves: labeled.filter(r => r.decision !== 'save' && r.expected === 'save').length,
    saved: valid.filter(r => r.decision === 'save').length,
    skipped: valid.filter(r => r.decision === 'skip').length,
    deferred: valid.filter(r => r.decision === 'defer').length,
    meanLatencyMs: valid.length ? Math.round(valid.reduce((n, r) => n + r.latencyMs, 0) / valid.length) : null,
    inputTokens: sumTokens('input_tokens'), outputTokens: sumTokens('output_tokens')
  };
}

export function renderReport(report) {
  const s = report.summary;
  const rows = report.results.map(r => `| ${r.id} | ${r.expected ?? 'unlabeled'} | ${r.decision ?? r.error} | ${r.matchesExpected === undefined ? '—' : r.matchesExpected ? 'yes' : 'no'} | ${r.latencyMs ?? '—'} |`);
  return `# Jev memory admission evaluation\n\nDevelopment evaluation; not a held-out benchmark or proof of production quality. No memory database was changed. Caller-supplied cases may contain private data; review before sharing.\n\nStarted: ${report.startedAt}\n\nPolicy: ${report.policy.version}; confidence threshold: ${report.policy.minConfidence} (experimental, not calibrated on memory).\n\nEvaluated ${s.evaluated}; errors ${s.errors}; matched ${s.matched}/${s.labeledEvaluated} labeled cases. False saves ${s.falseSaves}; missed saves ${s.missedSaves}; deferrals ${s.deferred}. Unlabeled cases are excluded from agreement and false/missed-save metrics.\n\n| Case | Expected | Observed | Match | ms |\n|---|---|---|---|---|\n${rows.join('\n')}\n\nSee report.json for exact questions, sources, candidates, answers, probabilities, model version and token usage. All failed or ambiguous cases are retained.\n`;
}
