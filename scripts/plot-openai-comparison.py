"""Render the published Luna pilot without additional API calls. Requires matplotlib."""
import json
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

root = Path(__file__).resolve().parents[1]
folder = root / 'evidence/comparison-openai-v1'
data = json.loads((folder / 'report.json').read_text(encoding='utf-8'))
assert data['completed'] and len(data['jevResults']) == len(data['llmResults']) == 100
assert len(data['readerResults']) == 60
paper, ink, green, red, amber, gray = '#FAF7F2', '#252722', '#5A7A4E', '#AD5549', '#C29B55', '#A8AAA1'
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 11, 'text.color': ink,
    'axes.labelcolor': ink, 'xtick.color': ink, 'ytick.color': ink, 'axes.spines.top': False,
    'axes.spines.right': False, 'axes.spines.left': False, 'axes.spines.bottom': False,
    'figure.facecolor': paper, 'axes.facecolor': paper, 'savefig.facecolor': paper})
labels = {'save-all': 'Save all', 'rules-v1': 'Simple rules', 'jev-0.75': 'Jev / 0.75', 'jev-0.4': 'Jev / 0.40',
    'llm-0.75': 'Luna / 0.75', 'llm-0.4': 'Luna / 0.40', 'no-memory': 'No memory', 'source-reference': 'Original source*'}
fig, (ax, bx) = plt.subplots(1, 2, figsize=(14, 6.4), gridspec_kw={'width_ratios': [1.15, 1]})
fig.subplots_adjust(left=.12, right=.965, top=.69, bottom=.24, wspace=.34)
fig.text(.06, .945, 'CAIRN / JEV LAB', color=green, fontsize=11, weight='bold')
fig.text(.06, .877, 'Memory admission: Jev and Luna', fontsize=25, weight='bold')
fig.text(.06, .821, '100 synthetic cases · same criteria · one paired live run · Luna reasoning: none', fontsize=11)
policies = data['policies']; y = np.arange(len(policies)); h = .31
for offset, field, color, label in [(-h/2, 'falseSaves', red, 'False saves / 50 non-save labels'),
                                  (h/2, 'missedSaves', amber, 'Missed saves / 50 save labels')]:
    vals = [p['summary'][field] for p in policies]
    ax.barh(y+offset, vals, height=h, color=color, label=label, zorder=3)
    for pos, v in zip(y+offset, vals): ax.text(v+.7, pos, str(v), va='center', fontsize=10)
ax.set_yticks(y, [labels[p['id']] for p in policies]); ax.invert_yaxis(); ax.set_xlim(0, 55)
ax.set_xlabel('Cases'); ax.grid(axis='x', color='#E6E4DA', zorder=0)
fig.legend(*ax.get_legend_handles_labels(), loc='upper left', bbox_to_anchor=(.055, .785), ncol=2, frameon=False, fontsize=10)
times = [[r['latencyMs'] for r in data[k]] for k in ['jevResults', 'llmResults']]
box = bx.boxplot(times, vert=False, patch_artist=True, widths=.4, showfliers=True,
    medianprops={'color': ink, 'linewidth': 2}, flierprops={'marker': '.', 'markersize': 4, 'markeredgecolor': gray})
for patch, color in zip(box['boxes'], [green, gray]): patch.set_facecolor(color); patch.set_edgecolor(color)
bx.set_yticks([1, 2], ['Jev', 'Luna']); bx.invert_yaxis()
bx.set_xlabel('Client latency (ms)'); bx.set_xlim(left=0); bx.grid(axis='x', color='#E6E4DA', zorder=0)
bx.set_title('100 gate calls per model', fontsize=12, loc='left', pad=12)
for i, vals in enumerate(times, 1):
    median = sorted(vals)[49]; p95 = sorted(vals)[94]
    bx.text(.02, .59 if i == 1 else .02, f'{["Jev", "Luna"][i-1]}: median {median:,} ms · p95 {p95:,} ms',
        transform=bx.transAxes, fontsize=10, va='bottom')
fig.text(.06, .055, 'Missed saves include deferred save cases. AI-authored labels; original disputed defer labels retained.\nNetwork and provider conditions affect latency. Box: quartiles; line: median; dots: outliers.', fontsize=9, color='#676B61')
fig.savefig(folder / 'admission-and-latency.png', dpi=160); plt.close(fig)

fig, ax = plt.subplots(figsize=(12, 7.2)); fig.subplots_adjust(left=.2, right=.96, top=.74, bottom=.26)
fig.text(.06, .945, 'CAIRN / JEV LAB', color=green, fontsize=11, weight='bold')
fig.text(.06, .875, 'What happens to the next answer?', fontsize=24, weight='bold')
fig.text(.06, .818, 'Same Luna reader · 20 multiple-choice follow-ups per policy · one candidate per session', fontsize=11)
arms = list(data['downstreamSummaries']); y = np.arange(len(arms)); left = np.zeros(len(arms))
for field, color, label in [('correctAnswers', green, 'Correct answer'), ('correctAbstentions', '#8EAC84', 'Justified unknown'),
                          ('missedAnswers', amber, 'Missed answer'), ('wrongAnswers', red, 'Wrong answer')]:
    vals = np.array([data['downstreamSummaries'][a][field] for a in arms]); ax.barh(y, vals, left=left, color=color, label=label, height=.63)
    for pos, v, start in zip(y, vals, left):
        if v: ax.text(start+v/2, pos, str(v), ha='center', va='center', color='white' if color in [green, red] else ink, fontsize=11, weight='bold')
    left += vals
ax.set_yticks(y, [labels[a] for a in arms]); ax.invert_yaxis(); ax.set_xlim(0, 20); ax.set_xticks(range(0, 21, 5)); ax.set_xlabel('Follow-up questions')
fig.legend(*ax.get_legend_handles_labels(), loc='upper left', bbox_to_anchor=(.22, .16), ncol=4, frameon=False, fontsize=10)
fig.text(.06, .035, '* Original source is privileged context. Ordinary policies see admitted candidates only.\n60 reader calls are shared across arms; 160 arm rows are paired, not independent. Two keys are unknown.\nAI-authored, post-hoc selected probes; this pilot does not establish production memory quality.', fontsize=9, color='#676B61')
fig.savefig(folder / 'downstream.png', dpi=160); plt.close(fig)
print('Rendered admission, latency and downstream figures from published evidence.')
