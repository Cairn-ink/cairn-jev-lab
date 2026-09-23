// Interface language. English page copy stays in index.html; zh-TW replaces it here.
// Strings built by app.js and dashboard.js live in both dictionaries. Recorded case text is never translated.
(() => {
  const en = {
    'toggle.label': '中文', 'toggle.aria': '切換為繁體中文',
    'mode.waiting': 'Waiting for a case', 'mode.recorded': 'Recorded · no API call', 'mode.live': 'Live response',
    'mode.calling': 'Calling Jev…', 'mode.incomplete': 'Evaluation incomplete',
    'evaluate': 'Evaluate with Jev ↗', 'evaluating': 'Evaluating…',
    'connection.unavailable': 'Local server unavailable. Reload after starting the lab.',
    'connection.live': 'Live ready · {model} · {remaining} of {max} calls remaining',
    'connection.recorded': 'Recorded examples ready. Run the lab locally with your key to evaluate new text.',
    'guide.live': 'Live mode is enabled on this local server. One API call per evaluation.',
    'guide.recorded': 'Download the repo and run locally with your TypeSafe key.',
    'provenance.recorded': 'Case {id} · {date} · expected: {expected}', 'provenance.live': 'Evaluated {time} · recommendation only',
    'policy.baseline': 'BASELINE', 'policy.preview': 'PREVIEW', 'policy.threshold': '{policy} · threshold {value}',
    'verdict.save': 'Save', 'verdict.skip': 'Skip', 'verdict.defer': 'Defer',
    'expected.save': 'save', 'expected.skip': 'skip', 'expected.defer': 'defer',
    'judgment.support': 'Source support', 'judgment.durability': 'Future usefulness', 'judgment.commitment': 'Commitment & uncertainty',
    'judgment.confidenceAria': '{label} confidence', 'judgment.confidence': 'Confidence {value}%',
    'metrics': '{model} · {ms} ms · {tokens} input tokens',
    'reason.supported_durable_faithful': 'Supported, useful beyond this session, and faithful to the source.',
    'reason.unsupported_candidate': 'The candidate is not supported by its source.',
    'reason.overstated_candidate': 'The candidate overstates the source.',
    'reason.temporary_content': 'This content appears temporary.',
    'reason.uncertain_assessment': 'At least one judgment is unclear or below the threshold.',
    'error.missing_api_key': 'Live mode needs TYPESAFE_API_KEY on the server. Recorded cases still work.',
    'error.session_limit_reached': 'This local session has reached its 20-call limit. Restart the server to begin another session.',
    'error.invalid_case': 'Enter a source and candidate within the displayed length limits.',
    'error.evaluation_in_progress': 'Another evaluation is running. Please try again after it finishes.',
    'error.network_or_timeout': 'The provider could not be reached within 30 seconds. No automatic retry was made.',
    'error.provider_http_401': 'TypeSafe rejected the server credentials. Check the local key file.',
    'error.provider_http_429': 'TypeSafe is rate limiting requests. No automatic retry was made.',
    'error.generic': 'Evaluation did not complete ({detail}). No memory was saved.', 'error.connectionLost': 'connection lost',
    'error.examples': 'Recorded examples could not load. Reload the page or view the published evidence on GitHub.',
    'study.loading': 'Loading recorded study…', 'study.variationLoading': 'Loading repeatability results…',
    'study.limitsLoading': 'Loading observed limitations…', 'study.chartLoading': 'Loading response times',
    'study.scope': '{model} · {date} · {cases} distinct cases · one pass',
    'study.latencyDetail': 'Median {median} ms · p95 {p95} ms',
    'study.agreementDetail': '{matched}/{total} matches · baseline {baseline}/{total}',
    'study.saveDetail': '{missed} intended saves still missed',
    'study.sampleDetail': '{cases} unique cases · {errors} request errors',
    'study.policy.baseline': 'Baseline', 'study.policy.preview': 'Preview',
    'study.barAria': '{group}, {policy}: {matched} of {total} match expected decisions',
    'study.variation': '20 cases per category. One response per case, shared by both policies. Baseline remains the default.',
    'study.chartAria': '{count} requests in deterministic interleaved order. Minimum {min}, median {median}, mean {mean}, p95 {p95}, maximum {max} milliseconds.',
    'study.barTitle': 'Request {n}: {ms} ms',
    'study.limits': '{falseSaves}/{nonSaves} false saves observed; {missed}/{saves} intended saves missed. Preview skipped all {deferSkips} cases labeled defer. Synthetic labels need independent review.',
    'study.failScope': 'Study data could not load. Read the published report below.',
    'study.failVariation': 'See the published experiment for recorded results.',
    'study.failLimits': 'Small synthetic study. No production reliability claim.'
  };

  const zh = {
    'toggle.label': 'EN', 'toggle.aria': 'Switch to English',
    'title': 'Cairn Jev Lab · 在它成為記憶之前',
    'description': '一個關於 AI 記憶的公開實驗。看看 Jev 的真實評估結果，比較不同的收錄規則，測試你的 AI 應該記住什麼。',
    'skip': '跳到試用區', 'brand.aria': 'Cairn Jev Lab 首頁', 'nav.aria': '主選單',
    'nav.findings': '實驗結果', 'nav.try': '自己試試',
    'hero.eyebrow': '一個關於 AI 記憶的公開實驗',
    'hero.title': '在它成為<br><em>記憶</em>之前。',
    'hero.lede': '你的 AI 該記住這句話嗎？<br>我們用 Jev 檢查一則記憶有沒有依據、<br class="desktop">之後用不用得到，以及是否忠於原話。',
    'hero.try': '自己試試 <span>↗</span>', 'hero.repo': '看 GitHub 原始碼 ↗',
    'hero.footnote': '開源 · 已記錄的範例不需要 key',
    'note.aria': '記憶範例示意', 'note.heading': '實驗筆記', 'note.said': '原話',
    'note.quote': '「下個月再討論，<br>目前什麼都還沒定案。」',
    'note.remember': 'Agent 可能記下的內容', 'note.candidate': '「團隊已經改成<br>每週發版。」',
    'note.pill': '略過', 'note.reason': '提議不等於決定。',
    'note.caption': '改編自已記錄案例 h13，原文為英文。<br>這個實驗室不會儲存任何記憶。',
    'snapshot.aria': '實測結果', 'snapshot.eyebrow': '實測數字，不是承諾。',
    'stat.latency': 'Jev 平均回應時間', 'stat.agreement': '預覽規則符合率',
    'stat.saved': '應保存且已保存', 'stat.evaluations': '英文評估次數',
    'snapshot.note': '100 個由 agent 撰寫的合成案例，沒有獨立的人工標註。這些是收錄建議，不是已驗證的事實，也不是已儲存的記憶。',
    'findings.eyebrow': '實驗結果', 'findings.title': '門檻一變，留下來的東西就不同。', 'findings.link': '看完整實驗 ↗',
    'chart.policies': '同一批回應，兩套規則。', 'chart.matches': '符合數 / 20',
    'legend.baseline': '<i class="legend-dot baseline"></i>基準 · 0.75', 'legend.preview': '<i class="legend-dot preview"></i>預覽 · 0.40',
    'chart.passAria': '各情境類別的符合數',
    'chart.timing': '每一次回應時間都保留。', 'chart.ms': '毫秒',
    'timing.median': '中位數', 'timing.p95': '第 95 百分位', 'timing.max': '最慢',
    'axis.first': '第一個請求', 'axis.middle': '各類別交錯', 'axis.last': '最後一個請求',
    'chart.timingNote': '包含網路時間與第一個請求，沒有排除離群值。這不是吞吐量測試，也不保證速度。',
    'limits.label': '還需要改進的地方', 'limits.link': '先前的重複性研究 ↗',
    'method.eyebrow': '判斷標準', 'method.title': '三個問題，<br>一個建議。',
    'method.support': '有依據嗎？', 'method.supportBody': '原文真的支持這則記憶嗎？',
    'method.useful': '之後用得到嗎？', 'method.usefulBody': '離開這段對話之後，它還重要嗎？',
    'method.faithful': '忠於原話嗎？', 'method.faithfulBody': '提議、條件和不確定性有沒有保留下來？',
    'try.eyebrow': '換你試試', 'try.title': '自己試試看。', 'try.lede': '先從已記錄的案例開始，再測試你自己的記憶。',
    'try.badge': '保存 / 略過 / 待定',
    'guide.explore': '瀏覽範例', 'guide.exploreBody': '真實的已記錄結果，不需要 key，也不會發出新的 API 呼叫。',
    'guide.evaluate': '評估你的文字',
    'examples.aria': '已記錄的範例',
    'examples.label': '從已記錄的案例開始 <span>不需要 key、不呼叫 API，案例為英文原文。</span>',
    'panel.evidence': '證據', 'panel.clear': '清除',
    'field.source': '原文 <span>實際說了什麼</span>', 'field.sourcePlaceholder': '使用者：我們在考慮 PostgreSQL，但還沒有決定。',
    'field.candidate': '候選記憶 <span>agent 會記下的內容</span>', 'field.candidatePlaceholder': '團隊已經採用 PostgreSQL。',
    'privacy': '即時評估會把這兩段文字傳給 TypeSafe，可能產生 API 費用。你的 key 只會留在本機伺服器。',
    'panel.resultAria': '評估結果', 'panel.judgment': '判斷結果',
    'empty.title': '記憶從證據開始。', 'empty.body': '從上方選一個已記錄的範例，<br>或評估你自己的原文與候選記憶。',
    'result.comparison': '同一個 Jev 回應，不同的信心門檻。<br>預設仍是基準規則，預覽規則還在實驗階段。',
    'result.judgments': '三項判斷', 'result.confidence': '信心值是 Jev 自己的估計，不保證正確。', 'result.download': '下載結果 ↓',
    'contribute.eyebrow': '幫我們找出邊界案例', 'contribute.title': '你的 AI 會在哪裡出錯？',
    'contribute.body': '試試你自己設計的合成範例，附上預期決定<br class="desktop">和實際結果，讓其他人也能重現。',
    'contribute.run': '在本機執行 ↗', 'contribute.share': '到 GitHub 分享案例 ↗',
    'cairn.eyebrow': 'Cairn 的一部分', 'cairn.title': '儲存之前，先做決定。',
    'cairn.body': '這個實驗室研究什麼值得成為記憶。<br class="desktop">Cairn Memory 是記憶本體的專案，這個展示不會寫入它。',
    'cairn.link': '看看 Cairn Memory ↗',
    'footer.credit': 'Cairn Jev Lab <span class="footer-dot">·</span> 由 Cairn 打造，由 Jev 驅動。',
    'footer.link': '一個實驗，證據全部公開。 ↗',

    'mode.waiting': '等待選擇案例', 'mode.recorded': '已記錄 · 不呼叫 API', 'mode.live': '即時回應',
    'mode.calling': '正在呼叫 Jev…', 'mode.incomplete': '評估未完成',
    'evaluate': '用 Jev 評估 ↗', 'evaluating': '評估中…',
    'connection.unavailable': '連不上本機伺服器，啟動實驗室後再重新整理。',
    'connection.live': '即時模式就緒 · {model} · 還剩 {remaining} / {max} 次呼叫',
    'connection.recorded': '已記錄的範例可以使用。在本機用你自己的 key 執行，就能評估新的文字。',
    'guide.live': '這台本機伺服器已開啟即時模式，每次評估呼叫一次 API。',
    'guide.recorded': '下載 repo，用你自己的 TypeSafe key 在本機執行。',
    'provenance.recorded': '案例 {id} · {date} · 預期：{expected}', 'provenance.live': '評估時間 {time} · 僅為建議',
    'policy.baseline': '基準', 'policy.preview': '預覽', 'policy.threshold': '{policy} · 門檻 {value}',
    'verdict.save': '保存', 'verdict.skip': '略過', 'verdict.defer': '待定',
    'expected.save': '保存', 'expected.skip': '略過', 'expected.defer': '待定',
    'judgment.support': '來源依據', 'judgment.durability': '長期價值', 'judgment.commitment': '提議與不確定性',
    'judgment.confidenceAria': '{label}的信心值', 'judgment.confidence': '信心值 {value}%',
    'choice.supported': '有依據', 'choice.unsupported': '沒有依據', 'choice.unclear': '不明確',
    'choice.durable': '長期有用', 'choice.temporary': '暫時性', 'choice.preserved': '忠於原話', 'choice.overstated': '過度推論',
    'metrics': '{model} · {ms} ms · {tokens} 個輸入 token',
    'reason.supported_durable_faithful': '有依據、之後用得到，也忠於原文。',
    'reason.unsupported_candidate': '原文不支持這則候選記憶。',
    'reason.overstated_candidate': '候選記憶超出了原文的意思。',
    'reason.temporary_content': '這段內容看起來只是暫時的。',
    'reason.uncertain_assessment': '至少有一項判斷不明確，或信心低於門檻。',
    'error.missing_api_key': '即時模式需要在伺服器設定 TYPESAFE_API_KEY，已記錄的案例仍然可以使用。',
    'error.session_limit_reached': '這次本機工作階段已經用完 20 次呼叫，重新啟動伺服器就能開始新的一輪。',
    'error.invalid_case': '請輸入原文和候選記憶，長度不要超過顯示的上限。',
    'error.evaluation_in_progress': '另一個評估還在進行，等它完成後再試一次。',
    'error.network_or_timeout': '30 秒內連不上服務，沒有自動重試。',
    'error.provider_http_401': 'TypeSafe 拒絕了伺服器的憑證，請檢查本機的 key 檔案。',
    'error.provider_http_429': 'TypeSafe 正在限制請求頻率，沒有自動重試。',
    'error.generic': '評估沒有完成（{detail}），沒有儲存任何記憶。', 'error.connectionLost': '連線中斷',
    'error.examples': '已記錄的範例無法載入。請重新整理頁面，或到 GitHub 查看已發布的結果。',
    'example.h01': '長期偏好', 'example.h13': '提議還是決定', 'example.h19': '缺少脈絡', 'example.h11': 'Jev 判斷失誤的案例',
    'study.loading': '正在載入已記錄的研究…', 'study.variationLoading': '正在載入結果…',
    'study.limitsLoading': '正在載入已觀察到的限制…', 'study.chartLoading': '正在載入回應時間',
    'study.scope': '{model} · {date} · {cases} 個不同案例 · 各跑一次',
    'study.latencyDetail': '中位數 {median} ms · p95 {p95} ms',
    'study.agreementDetail': '{matched}/{total} 符合 · 基準規則 {baseline}/{total}',
    'study.saveDetail': '仍有 {missed} 筆應保存的記憶被漏收',
    'study.sampleDetail': '{cases} 個獨立案例 · {errors} 個請求錯誤',
    'study.policy.baseline': '基準', 'study.policy.preview': '預覽',
    'study.barAria': '{group}，{policy}：{total} 個案例中有 {matched} 個符合預期決定',
    'study.variation': '每個類別 20 個案例。每個案例只取一次回應，兩套規則共用。預設仍是基準規則。',
    'study.chartAria': '{count} 個請求，依固定順序交錯排列。最小 {min}、中位數 {median}、平均 {mean}、p95 {p95}、最大 {max} 毫秒。',
    'study.barTitle': '第 {n} 個請求：{ms} ms',
    'study.limits': '觀察到 {falseSaves}/{nonSaves} 筆誤收，{missed}/{saves} 筆應保存的記憶被漏收。標為待定的 {deferSkips} 個案例，預覽規則全部略過。合成標籤仍需要獨立審查。',
    'study.failScope': '研究資料無法載入，請看下方已發布的報告。',
    'study.failVariation': '已記錄的結果請看已發布的實驗。',
    'study.failLimits': '小規模的合成研究，不代表正式環境的可靠度。',
    'group.scope': '偏好與適用範圍', 'group.actor': '說話者與歸屬', 'group.decision': '提議與決定',
    'group.uncertainty': '條件與不確定性', 'group.revision': '更新與更正'
  };

  const supported = ['en', 'zh-TW'];
  const storage = { get() { try { return localStorage.getItem('lab-lang'); } catch { return null; } },
    set(value) { try { localStorage.setItem('lab-lang', value); } catch { /* Preference is a convenience only. */ } } };
  const fromUrl = new URLSearchParams(location.search).get('lang');
  // Otherwise follow the browser's own order: the first English or Chinese entry wins, so en-US before zh-TW stays English.
  const preferred = (navigator.languages || [navigator.language]).find(value => /^(en|zh)\b/i.test(value || ''));
  let lang = [fromUrl, storage.get()].find(value => supported.includes(value)) || (/^zh/i.test(preferred || '') ? 'zh-TW' : 'en');

  // Falls back to English, then to the key, so a missing translation never blanks the page.
  function t(key, vars = {}, fallback) {
    const text = (lang === 'zh-TW' ? zh[key] : undefined) ?? en[key] ?? fallback ?? key;
    return text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
  }
  const description = document.querySelector('meta[name="description"]');
  const original = { title: document.title, description: description?.content };
  function apply() {
    document.documentElement.lang = lang;
    document.title = lang === 'zh-TW' ? zh.title : original.title;
    if (description) description.content = lang === 'zh-TW' ? zh.description : original.description;
    for (const el of document.querySelectorAll('[data-i18n]')) {
      el.dataset.i18nEn ??= el.innerHTML;
      el.innerHTML = lang === 'zh-TW' ? zh[el.dataset.i18n] ?? el.dataset.i18nEn : el.dataset.i18nEn;
    }
    for (const el of document.querySelectorAll('[data-i18n-attr]')) {
      for (const pair of el.dataset.i18nAttr.split(',')) {
        const [attr, key] = pair.split(':'); const store = `i18nEn${attr.replace(/(^|-)(\w)/g, (m, dash, c) => c.toUpperCase())}`;
        el.dataset[store] ??= el.getAttribute(attr) ?? '';
        el.setAttribute(attr, lang === 'zh-TW' ? zh[key] ?? el.dataset[store] : el.dataset[store]);
      }
    }
    const toggle = document.getElementById('lang-toggle');
    if (toggle) { toggle.textContent = t('toggle.label'); toggle.setAttribute('aria-label', t('toggle.aria')); toggle.lang = lang === 'zh-TW' ? 'en' : 'zh-Hant'; }
  }
  function set(next) {
    if (!supported.includes(next) || next === lang) return;
    lang = next; storage.set(next);
    const url = new URL(location.href);
    if (url.searchParams.has('lang')) { url.searchParams.set('lang', next); history.replaceState(null, '', url); }
    apply(); document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  }

  window.labI18n = { t, set, get lang() { return lang; }, locale: () => (lang === 'zh-TW' ? 'zh-TW' : 'en-US'), strings: { en, zh } };
  apply();
  document.getElementById('lang-toggle')?.addEventListener('click', () => set(lang === 'zh-TW' ? 'en' : 'zh-TW'));
})();
