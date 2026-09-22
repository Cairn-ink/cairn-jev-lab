// Published evidence only. Playground calls never change these study metrics.
(async () => {
  const byId = id => document.getElementById(id);
  const put = (id, text) => { byId(id).textContent = text; };
  const make = (tag, cls, text) => { const el = document.createElement(tag); el.className = cls; if (text !== undefined) el.textContent = text; return el; };
  try {
    const response = await fetch('./study.json');
    if (!response.ok) throw new Error('study_unavailable');
    const study = await response.json();
    const [baseline, preview] = study.policies;
    const s = preview.summary;
    put('study-scope', `${study.model} · ${study.date} · ${study.uniqueCases} distinct cases · one pass`);
    put('mean-latency', study.latency.mean);
    put('latency-detail', `Median ${study.latency.median} ms · p95 ${study.latency.p95} ms`);
    put('preview-agreement', Math.round(s.matched / s.labeledEvaluated * 100));
    put('agreement-detail', `${s.matched}/${s.labeledEvaluated} matches · baseline ${baseline.summary.matched}/${s.labeledEvaluated}`);
    put('saved-count', s.expectedSaves - s.missedSaves);
    put('saved-total', `/${s.expectedSaves}`);
    put('save-detail', `${s.missedSaves} intended saves still missed`);
    put('evaluation-count', study.completed);
    put('sample-detail', `${study.uniqueCases} unique cases · ${study.errors} request errors`);
    put('median-latency', `${study.latency.median} ms`);
    put('p95-latency', `${study.latency.p95} ms`);
    put('max-latency', `${study.latency.max} ms`);
    for (let i = 0; i < study.groups.length; i++) {
      const row = make('div', 'pass-row'); row.append(make('span', 'pass-name', study.groups[i].name));
      const bars = make('div', 'pass-bars');
      for (const [p, cls, name] of [[baseline, 'baseline', 'Baseline'], [preview, 'preview', 'Preview']]) {
        const result = p.groups[i]; const track = make('div', 'bar-track');
        track.setAttribute('role', 'img'); track.setAttribute('aria-label', `${study.groups[i].name}, ${name}: ${result.matched} of ${result.labeledEvaluated} match expected decisions`);
        const fill = make('span', `bar-fill ${cls}`, String(result.matched));
        fill.style.width = `${result.matched / result.labeledEvaluated * 100}%`; track.append(fill); bars.append(track);
      }
      row.append(bars); byId('pass-chart').append(row);
    }
    put('variation-note', '20 cases per category. One response per case, shared by both policies. Baseline remains the default.');
    const chart = byId('latency-chart');
    chart.setAttribute('aria-label', `${study.completed} requests in deterministic interleaved order. Minimum ${study.latency.min}, median ${study.latency.median}, mean ${study.latency.mean}, p95 ${study.latency.p95}, maximum ${study.latency.max} milliseconds.`);
    study.latency.values.forEach((ms, i) => { const bar = make('span', 'latency-bar'); bar.style.height = `${ms / study.latency.max * 100}%`; bar.title = `Request ${i + 1}: ${ms} ms`; chart.append(bar); });
    put('study-limits', `${s.falseSaves}/${s.labeledEvaluated - s.expectedSaves} false saves observed; ${s.missedSaves}/${s.expectedSaves} intended saves missed. Preview skipped all ${preview.confusion.defer.skip} cases labeled defer. Synthetic labels need independent review.`);
  } catch {
    put('study-scope', 'Study data could not load. Read the published report below.');
    put('variation-note', 'See the published experiment for recorded results.');
    put('study-limits', 'Small synthetic study. No production reliability claim.');
  }
})();
