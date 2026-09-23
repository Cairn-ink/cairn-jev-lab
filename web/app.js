const $ = id => document.getElementById(id);
let status, examples = [], currentResult = null, busy = false;
const { t } = window.labI18n;
let modeKey = 'mode.waiting', errorText = null;
function setMode(key, className = '') { modeKey = key; $('mode').textContent = t(key); $('mode').className = `mode ${className}`.trim(); }
function showError(render) { errorText = render; $('error').textContent = render(); $('error').hidden = false; }
function node(tag, className, text) { const el = document.createElement(tag); if (className) el.className = className; if (text !== undefined) el.textContent = text; return el; }
function counts() { $('source-count').textContent = `${$('source').value.length.toLocaleString()} / 4,000`; $('candidate-count').textContent = `${$('candidate').value.length.toLocaleString()} / 1,000`; }
function updateStatus() {
  $('evaluate').disabled = busy || !status?.configured || status.remaining <= 0;
  $('evaluate').textContent = t(busy ? 'evaluating' : 'evaluate');
  $('connection').textContent = !status ? t('connection.unavailable') : status.configured
    ? t('connection.live', { model: status.model, remaining: status.remaining, max: status.maxCalls }) : t('connection.recorded');
  if ($('live-guide')) $('live-guide').textContent = t(status?.configured ? 'guide.live' : 'guide.recorded');
  $('clear').disabled = busy;
  for (const el of [$('source'), $('candidate')]) el.disabled = busy;
  for (const button of $('examples').children) button.disabled = busy;
}
function clearResult() { currentResult = null; errorText = null; $('result').hidden = true; $('empty').hidden = false; setMode('mode.waiting'); $('error').hidden = true; for (const b of $('examples').children) b.setAttribute('aria-pressed', 'false'); }
function show(result) {
  currentResult = result; $('error').hidden = true; $('empty').hidden = true; $('result').hidden = false;
  setMode(`mode.${result.mode}`, result.mode);
  $('provenance').textContent = result.mode === 'recorded'
    ? t('provenance.recorded', { id: result.id, date: result.recordedAt.slice(0, 10), expected: t(`expected.${result.expected}`, {}, result.expected) })
    : t('provenance.live', { time: new Date(result.evaluatedAt).toLocaleTimeString(window.labI18n.locale()) });
  $('decisions').replaceChildren();
  for (const p of result.policies) {
    const d = result.decisions[p.version]; const card = node('div', `decision ${d.decision}`);
    card.append(node('p', 'decision-label', t('policy.threshold', { policy: t(p.version === 'admission-v1' ? 'policy.baseline' : 'policy.preview'), value: p.minConfidence.toFixed(2) })),
      node('p', 'verdict', t(`verdict.${d.decision}`)), node('p', 'reason', t(`reason.${d.reason}`)));
    $('decisions').append(card);
  }
  $('judgments').replaceChildren();
  for (const [key, answer] of Object.entries(result.answers)) {
    const row = node('div', 'judgment'); const top = node('div', 'judgment-top');
    const label = t(`judgment.${key}`);
    top.append(node('span', '', label), node('span', 'choice', t(`choice.${answer.choice}`, {}, answer.choice)));
    const confidence = node('div', 'confidence-row'); const bar = node('progress'); bar.max = 1; bar.value = answer.confidence; bar.setAttribute('aria-label', t('judgment.confidenceAria', { label }));
    confidence.append(bar, node('span', '', t('judgment.confidence', { value: Math.round(answer.confidence * 100) }))); row.append(top, confidence); $('judgments').append(row);
  }
  $('metrics').textContent = t('metrics', { model: result.model, ms: result.latencyMs, tokens: result.usage.input_tokens ?? '?' });
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
  if (!$('source').value.trim() || !$('candidate').value.trim()) { showError(() => t('error.invalid_case')); return; }
  clearResult(); busy = true; updateStatus(); setMode('mode.calling');
  try {
    const response = await fetch('/api/evaluate', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Token': status.token },
      body: JSON.stringify({ source: $('source').value, candidate: $('candidate').value }) });
    const result = await response.json();
    if (Number.isInteger(result.remaining)) status.remaining = result.remaining;
    if (!response.ok) throw new Error(result.error || 'evaluation_failed');
    show(result);
  } catch (error) {
    const code = error.message;
    showError(() => t(`error.${code}`, {}, t('error.generic', { detail: code === 'Failed to fetch' ? t('error.connectionLost') : code }))); setMode('mode.incomplete');
  }
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
      const button = node('button', '', t(`example.${example.id}`, {}, example.label)); button.type = 'button'; button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => { if (busy) return; clearResult(); $('source').value = example.source; $('candidate').value = example.candidate; counts(); button.setAttribute('aria-pressed', 'true'); show(example); }); $('examples').append(button);
    }
  } catch { showError(() => t('error.examples')); }
  updateStatus();
}
document.addEventListener('langchange', () => {
  counts(); updateStatus();
  examples.forEach((example, i) => { if ($('examples').children[i]) $('examples').children[i].textContent = t(`example.${example.id}`, {}, example.label); });
  if (currentResult) show(currentResult); else $('mode').textContent = t(modeKey);
  if (errorText) $('error').textContent = errorText();
});
setMode('mode.waiting');
start();
