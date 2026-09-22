const $ = id => document.getElementById(id);
let status, examples = [], currentResult = null, busy = false;
const labels = { support: 'Source support', durability: 'Future usefulness', commitment: 'Commitment & uncertainty' };
const reasons = { supported_durable_faithful: 'Supported, useful beyond this session, and faithful to the source.',
  unsupported_candidate: 'The candidate is not supported by its source.', overstated_candidate: 'The candidate overstates the source.',
  temporary_content: 'This content appears temporary.', uncertain_assessment: 'At least one judgment is unclear or below the threshold.' };
const errors = { missing_api_key: 'Live mode needs TYPESAFE_API_KEY on the server. Recorded cases still work.',
  session_limit_reached: 'This local session has reached its 20-call limit. Restart the server to begin another session.',
  invalid_case: 'Enter a source and candidate within the displayed length limits.',
  evaluation_in_progress: 'Another evaluation is running. Please try again after it finishes.',
  network_or_timeout: 'The provider could not be reached within 30 seconds. No automatic retry was made.',
  provider_http_401: 'TypeSafe rejected the server credentials. Check the local key file.',
  provider_http_429: 'TypeSafe is rate limiting requests. No automatic retry was made.' };
function node(tag, className, text) { const el = document.createElement(tag); if (className) el.className = className; if (text !== undefined) el.textContent = text; return el; }
function counts() { $('source-count').textContent = `${$('source').value.length.toLocaleString()} / 4,000`; $('candidate-count').textContent = `${$('candidate').value.length.toLocaleString()} / 1,000`; }
function updateStatus() {
  $('evaluate').disabled = busy || !status?.configured || status.remaining <= 0;
  $('evaluate').textContent = busy ? 'Evaluating…' : 'Evaluate with Jev ↗';
  $('connection').textContent = !status ? 'Local server unavailable. Reload after starting the lab.' : status.configured
    ? `Live ready · ${status.model} · ${status.remaining} of ${status.maxCalls} calls remaining` : 'Recorded examples ready. Run the lab locally with your key to evaluate new text.';
  if ($('live-guide')) $('live-guide').textContent = status?.configured ? 'Live mode is enabled on this local server. One API call per evaluation.' : 'Download the repo and run locally with your TypeSafe key.';
  $('clear').disabled = busy;
  for (const el of [$('source'), $('candidate')]) el.disabled = busy;
  for (const button of $('examples').children) button.disabled = busy;
}
function clearResult() { currentResult = null; $('result').hidden = true; $('empty').hidden = false; $('mode').textContent = 'Waiting for a case'; $('mode').className = 'mode'; $('error').hidden = true; for (const b of $('examples').children) b.setAttribute('aria-pressed', 'false'); }
function show(result) {
  currentResult = result; $('error').hidden = true; $('empty').hidden = true; $('result').hidden = false;
  $('mode').textContent = result.mode === 'recorded' ? 'Recorded · no API call' : 'Live response';
  $('mode').className = `mode ${result.mode}`;
  $('provenance').textContent = result.mode === 'recorded'
    ? `Case ${result.id} · ${result.recordedAt.slice(0, 10)} · expected: ${result.expected}` : `Evaluated ${new Date(result.evaluatedAt).toLocaleTimeString('en-US')} · recommendation only`;
  $('decisions').replaceChildren();
  for (const p of result.policies) {
    const d = result.decisions[p.version]; const card = node('div', `decision ${d.decision}`);
    card.append(node('p', 'decision-label', `${p.version === 'admission-v1' ? 'BASELINE' : 'PREVIEW'} · threshold ${p.minConfidence.toFixed(2)}`),
      node('p', 'verdict', d.decision[0].toUpperCase() + d.decision.slice(1)), node('p', 'reason', reasons[d.reason]));
    $('decisions').append(card);
  }
  $('judgments').replaceChildren();
  for (const [key, answer] of Object.entries(result.answers)) {
    const row = node('div', 'judgment'); const top = node('div', 'judgment-top');
    top.append(node('span', '', labels[key]), node('span', 'choice', answer.choice));
    const confidence = node('div', 'confidence-row'); const bar = node('progress'); bar.max = 1; bar.value = answer.confidence; bar.setAttribute('aria-label', `${labels[key]} confidence`);
    confidence.append(bar, node('span', '', `Confidence ${Math.round(answer.confidence * 100)}%`)); row.append(top, confidence); $('judgments').append(row);
  }
  $('metrics').textContent = `${result.model} · ${result.latencyMs} ms · ${result.usage.input_tokens ?? '?'} input tokens`;
}
for (const id of ['source', 'candidate']) $(id).addEventListener('input', () => { counts(); clearResult(); });
$('clear').addEventListener('click', () => { $('source').value = ''; $('candidate').value = ''; counts(); clearResult(); $('source').focus(); });
$('download').addEventListener('click', () => {
  if (!currentResult) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(currentResult, null, 2)], { type: 'application/json' }));
  const a = node('a'); a.href = url; a.download = `cairn-jev-${currentResult.mode}-result.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('evaluate-form').addEventListener('submit', async event => {
  event.preventDefault(); if (busy || !status?.configured || status.remaining <= 0) return;
  if (!$('source').value.trim() || !$('candidate').value.trim()) { $('error').textContent = errors.invalid_case; $('error').hidden = false; return; }
  clearResult(); busy = true; updateStatus(); $('mode').textContent = 'Calling Jev…';
  try {
    const response = await fetch('/api/evaluate', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Token': status.token },
      body: JSON.stringify({ source: $('source').value, candidate: $('candidate').value }) });
    const result = await response.json();
    if (Number.isInteger(result.remaining)) status.remaining = result.remaining;
    if (!response.ok) throw new Error(result.error || 'evaluation_failed');
    show(result);
  } catch (error) { $('error').textContent = errors[error.message] || `Evaluation did not complete (${error.message === 'Failed to fetch' ? 'connection lost' : error.message}). No memory was saved.`; $('error').hidden = false; $('mode').textContent = 'Evaluation incomplete'; }
  finally { busy = false; updateStatus(); }
});
async function start() {
  try {
    const response = await fetch('./examples.json');
    if (!response.ok) throw new Error('examples_unavailable');
    examples = await response.json();
    status = { configured: false, remaining: 0 };
    // Public/static copies are replay-only. Live calls belong to the loopback server.
    if (location.hostname === '127.0.0.1') {
      try { const live = await fetch('/api/status'); if (live.ok) status = await live.json(); } catch { /* Recorded examples remain usable. */ }
    }
    for (const example of examples) {
      const button = node('button', '', example.label); button.type = 'button'; button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => { if (busy) return; clearResult(); $('source').value = example.source; $('candidate').value = example.candidate; counts(); button.setAttribute('aria-pressed', 'true'); show(example); }); $('examples').append(button);
    }
  } catch { $('error').textContent = 'Recorded examples could not load. Reload the page or view the published evidence on GitHub.'; $('error').hidden = false; }
  updateStatus();
}
start();
