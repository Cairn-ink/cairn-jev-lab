# Cairn Jev Lab

用 Jev 試驗一個小問題：**這段內容適不適合成為長期記憶？**

Cairn 定義標準，Jev 評估，程式回傳 `save`（保存）、`skip`（略過）、`defer`（待定）。這是獨立實驗，尚未接入 Cairn Memory，不會修改任何記憶資料庫。

## 判斷標準

1. **忠於來源**：主體、時間、範圍與不確定性不能被改寫。
2. **長期有用**：偏好、專案決策、工作規則及有意義的決策歷史。
3. **保留狀態**：「考慮中」不能變成「已採用」，轉述不能變成本人偏好。

每個案例一次 API 呼叫，同時提出三個 Choice 問題。高信心的不支持、過度推論或臨時內容會略過；任何未解的不確定性會待定；三項均通過才保存。門檻暫設 0.75，這是可測的實驗規則，不代表 75% 正確率，也沒有經過 memory 領域校準。文字始終原樣保存於報告，不由 Jev 改寫。

來源缺失不能靠評分補回。`skip` 只表示不收錄這筆候選，不刪除原始對話。未來整合時，使用者明確要求記住的路徑應維持獨立。

## 開始

需要 Node.js 22 以上，沒有第三方套件依賴。

```sh
npm test
npm run preview
```

Preview 只顯示人工預期，不呼叫 Jev。20 個案例全為合成文字，主要使用繁體中文，涵蓋偏好、提議、決策、臨時例外、不同人物及來源內指令。

實測：將 `.env.example` 複製為 `.env`，在本機填入 `TYPESAFE_API_KEY`，再執行：

```sh
npm run live -- --limit 20
```

也可以直接使用 repo 外的金鑰檔案：

```sh
node --env-file=/absolute/path/to/.env src/cli.mjs --live --limit 20
```

每次最多 20 次呼叫，序列執行、不自動重試，錯誤時停止並保留部分報告；每次逾時 30 秒。這是呼叫次數上限，不是供應商帳戶的金額上限。即時執行會把案例原文與候選記憶送到 TypeSafe，可能產生 API 費用。預設 `jev-latest`；可用環境變數 `JEV_MODEL` 指定供應商提供的版本，回傳版本也會記錄。

## 看結果

首次真實 API 實測（2026-09-22，`jev-1.13.0`）：20 題中 13 題與預期一致，0 筆誤收、7 筆預期保存但未保存，平均每次 298 ms。9 筆預期保存的候選只有 2 筆放行；因此目前規則過於保守，尚不適合直接控制正式記憶寫入。[完整報告](evidence/pilot-2026-09-22/report.md) · [逐題資料](evidence/pilot-2026-09-22/report.json) · [結果解讀](evidence/pilot-2026-09-22/notes.md)。

每次實測產生 `runs/<timestamp>/report.json` 與 `report.md`，包含問題、資料集雜湊、實際模型版本、每題機率／信心、延遲、token 用量、誤收、漏收與待定數。預期答案不會傳給模型。

`runs/` 預設不提交，因為日後可能包含私有測試內容；經人工檢查的合成結果才放進 `evidence/`。`.env` 不提交，金鑰不寫入報告，供應商錯誤本文不印出。

這些是開發案例，**不是獨立測試集或品質保證**。保留失敗案例；若調整規則，另存版本並用新案例驗證。不要以高信心當成來源語意已驗證。

## 與 Cairn 的關係

候選記憶＋來源 → Jev 評估 → 程式套用 admission policy → 將決策交還 Cairn。

後續可以把 `src/gate.mjs` 和 `src/jev.mjs` 包成可選 adapter。Cairn 仍負責來源憑證、namespace、版本、明確保存、修正與遺忘；這個實驗不處理取用、取代或淘汰。

設計靈感來自 [jev-memory](https://github.com/NicolasMontone/jev-memory) 的記憶關卡；本 repo 為獨立實作，直接使用 [TypeSafe API](https://docs.typesafe.ai/introduction/quickstart)。另見 [Cairn Memory](https://github.com/Cairn-ink/cairn-memory)。

程式碼採 MIT License。
