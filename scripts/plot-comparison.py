"""Optional figure generator: python scripts/plot-comparison.py (requires matplotlib)."""
import json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

root = Path(__file__).resolve().parents[1]
out = root / 'evidence' / 'comparison-v1'
report = json.loads((out / 'offline-report.json').read_text(encoding='utf-8'))
paper, ink, moss, muted = '#FAF7F2', '#1F1D1A', '#5A7A4E', '#6B6560'
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 10, 'text.color': ink,
                     'axes.labelcolor': ink, 'xtick.color': muted, 'ytick.color': muted,
                     'axes.edgecolor': '#DCD8CE', 'figure.facecolor': paper, 'axes.facecolor': paper})
fig, axes = plt.subplots(1, 2, figsize=(12, 6.2))
fig.suptitle('What gets stored — and what gets left behind?', fontsize=19, x=.07, ha='left', y=.96)
names = ['Save all', 'Simple rules', 'Jev · 0.75', 'Jev · 0.40']
s = [p['summary'] for p in report['policies']]
y = np.arange(4)
good = [p['saved'] - p['falseSaves'] for p in s]
bad = [p['falseSaves'] for p in s]
axes[0].barh(y, good, color=moss, label='Intended saves kept', height=.53)
axes[0].barh(y, bad, left=good, color='#AF7464', label='False saves', height=.53)
for i, (g, b) in enumerate(zip(good, bad)):
    axes[0].text(g + b + 2, i, str(g + b), va='center', fontsize=10)
axes[0].set_yticks(y, names)
axes[0].invert_yaxis()
axes[0].set_xlim(0, 112)
axes[0].set_xlabel('Stored candidates / 100')
axes[0].set_title('Four policies, identical candidates', loc='left', pad=16)
axes[0].legend(loc='upper left', bbox_to_anchor=(-.03, -0.23), frameon=False, fontsize=9)

curve = report['thresholdSweep']
x = [p['threshold'] for p in curve]
for key, label, color, marker in [('missedSaves', 'Missed saves / 50', moss, 'o'),
                                 ('falseSaves', 'False saves / 50', '#AF7464', 's'),
                                 ('deferred', 'Deferred / 100', '#727272', '^')]:
    axes[1].plot(x, [p[key] for p in curve], color=color, marker=marker, markersize=4, linewidth=1.8, label=label)
axes[1].set_xlim(0, 1)
axes[1].set_ylim(-3, 103)
axes[1].set_xlabel('Confidence threshold')
axes[1].set_ylabel('Case count (denominators differ)')
axes[1].set_title('Jev threshold sweep · archived responses', loc='left', pad=16)
axes[1].legend(loc='upper left', bbox_to_anchor=(-.03, -0.23), frameon=False, fontsize=9)
for ax in axes:
    ax.spines[['top', 'right']].set_visible(False)
    ax.grid(axis='x', color='#DCD8CE', alpha=.5)
    ax.set_axisbelow(True)
fig.subplots_adjust(left=.12, right=.96, top=.8, bottom=.34, wspace=.37)
fig.text(.07, .025, '100 synthetic, AI-authored labels · original defer labels retained · no new API calls\n'
         'Descriptive comparison; no LLM baseline or downstream reader results yet.', color=muted, fontsize=9)
fig.savefig(out / 'tradeoffs.png', dpi=170, facecolor=paper)
plt.close(fig)
