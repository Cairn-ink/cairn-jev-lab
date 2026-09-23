// Published evidence only. Playground calls never change these study metrics.
(async () => {
  const { t } = window.labI18n;
  const byId = id => document.getElementById(id);
  const put = (id, text) => { byId(id).textContent = text; };
  const make = (tag, cls, text) => { const el = document.createElement(tag); el.className = cls; if (text !== undefined) el.textContent = text; return el; };
  let study = null, failed = false;
  function render() {
    if (failed) {
      put('study-scope', t('study.failScope'));
      put('variation-note', t('study.failVariation'));
      put('study-limits', t('study.failLimits'));
      return;
    }
    if (!study) {
      put('study-scope', t('study.loading'));
      put('variation-note', t('study.variationLoading'));
      put('study-limits', t('study.limitsLoading'));
      byId('latency-chart').setAttribute('aria-label', t('study.chartLoading'));
      return;
    }
    const [baseline, preview] = study.policies;
    const s = preview.summary;
    put('study-scope', t('study.scope', { model: study.model, date: study.date, cases: study.uniqueCases }));
    put('mean-latency', study.latency.mean);
    put('latency-detail', t('study.latencyDetail', { median: study.latency.median, p95: study.latency.p95 }));
    put('preview-agreement', Math.round(s.matched / s.labeledEvaluated * 100));
    put('agreement-detail', t('study.agreementDetail', { matched: s.matched, total: s.labeledEvaluated, baseline: baseline.summary.matched }));
    put('saved-count', s.expectedSaves - s.missedSaves);
    put('saved-total', `/${s.expectedSaves}`);
    put('save-detail', t('study.saveDetail', { missed: s.missedSaves }));
    put('evaluation-count', study.completed);
    put('sample-detail', t('study.sampleDetail', { cases: study.uniqueCases, errors: study.errors }));
    put('median-latency', `${study.latency.median} ms`);
    put('p95-latency', `${study.latency.p95} ms`);
    put('max-latency', `${study.latency.max} ms`);
    byId('pass-chart').replaceChildren();
    for (let i = 0; i < study.groups.length; i++) {
      const group = t(`group.${study.groups[i].key}`, {}, study.groups[i].name);
      const row = make('div', 'pass-row'); row.append(make('span', 'pass-name', group));
      const bars = make('div', 'pass-bars');
      for (const [p, cls] of [[baseline, 'baseline'], [preview, 'preview']]) {
        const result = p.groups[i]; const track = make('div', 'bar-track');
        track.setAttribute('role', 'img'); track.setAttribute('aria-label', t('study.barAria', { group, policy: t(`study.policy.${cls}`), matched: result.matched, total: result.labeledEvaluated }));
        const fill = make('span', `bar-fill ${cls}`, String(result.matched));
        fill.style.width = `${result.matched / result.labeledEvaluated * 100}%`; track.append(fill); bars.append(track);
      }
      row.append(bars); byId('pass-chart').append(row);
    }
    put('variation-note', t('study.variation'));
    const chart = byId('latency-chart'); const { latency } = study;
    chart.setAttribute('aria-label', t('study.chartAria', { count: study.completed, min: latency.min, median: latency.median, mean: latency.mean, p95: latency.p95, max: latency.max }));
    chart.replaceChildren();
    latency.values.forEach((ms, i) => { const bar = make('span', 'latency-bar'); bar.style.height = `${ms / latency.max * 100}%`; bar.title = t('study.barTitle', { n: i + 1, ms }); chart.append(bar); });
    put('study-limits', t('study.limits', { falseSaves: s.falseSaves, nonSaves: s.labeledEvaluated - s.expectedSaves, missed: s.missedSaves, saves: s.expectedSaves, deferSkips: preview.confusion.defer.skip }));
  }
  document.addEventListener('langchange', render);
  render();
  try {
    const response = await fetch('./study.json');
    if (!response.ok) throw new Error('study_unavailable');
    study = await response.json();
    render();
  } catch { failed = true; render(); }
})();
