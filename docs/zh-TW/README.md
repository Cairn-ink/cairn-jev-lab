# Cairn Jev Lab

**測試你的 AI 應該記住什麼。**

[English / 主要文件](../../README.md) · [首次實測中文解讀](pilot-2026-09-22.md)

這是一個實驗性的記憶收錄評估工具。輸入原文與候選記憶，Jev 評估證據，程式依據明確規則回傳「保存、略過、待定」。適合讓開發者在交給 agent 自動記憶之前，先測試自己的標準。

## 我們提供什麼

- **可檢查的標準**：分別評估忠於來源、長期價值，以及是否保留提議、轉述和不確定性。
- **可自行測試的案例入口**：提供英文範例，也能加入自己的原文與候選記憶。
- **可檢視的評估報告**：保留各項選擇、機率、信心、規則原因、延遲、用量與失敗案例。

這個工具不抽取或改寫記憶、不操作資料庫，也沒有直接接入 Cairn Memory。`save` 是收錄建議，不代表事實已驗證。

## 快速開始

需要 Node.js 22 以上；不必安裝第三方套件。

```sh
git clone https://github.com/Cairn-ink/cairn-jev-lab.git
cd cairn-jev-lab
node --test
node src/cli.mjs
```

預覽會檢查並列出 20 個英文開發案例，不需要 key，也不呼叫 API。`expected` 是預先寫好的人工預期，並非模型輸出。

將 `.env.example` 複製為 `.env`，在本機填入 `TYPESAFE_API_KEY`，即可執行：

```sh
node --env-file=.env src/cli.mjs --live --input examples/my-cases.json
```

這會把來源與候選記憶傳送給 TypeSafe，可能產生 API 費用。一次最多 20 筆，每筆一個請求、30 秒逾時、不自動重試；錯誤時停止並保留部分報告。呼叫次數上限不是帳單金額上限。

## 測試自己的案例

建立 JSON 陣列，每筆有 `id`、`source`、`candidate`。可加 `expected`（`save`、`skip`、`defer`）與 `why` 標記預期原因。沒有預期答案也能評估，但不納入誤收、漏收和符合率。

```sh
node src/cli.mjs --input examples/my-cases.json
node --env-file=.env src/cli.mjs --live --input examples/my-cases.json
```

詳細欄位與限制見 [測試指南](../testing.md)。私人案例建議放在已忽略的 `local-cases/`；報告放在 `runs/`，含有原文，分享前請先檢查。

## 如何判斷

`admission-v1` 暫用 0.75 信心門檻：明確不支持、過度推論或臨時內容會略過；其餘有未解不確定性則待定；三項均以足夠信心通過才建議保存。這是實驗規則，不代表 75% 正確率。完整規則見 [政策文件](../policy.md)。

首次主要使用繁體中文的 20 題實測：13 題符合預期、沒有誤收，但 9 筆預期應保存的內容只放行 2 筆，平均每次約 298 ms。規則目前過於保守，適合先旁路評估。

翻譯的開發案例 `fixtures/english.json` 尚未實測；另外新增的 20 題英文案例已完成實測。原始中文資料與結果保留原樣。

## 新一輪實驗與試用頁面

我們先用舊回應離線分析門檻，再凍結 0.40 的預覽規則與新的英文測試集，才呼叫 Jev。兩套規則使用同一批 20 個回應：符合預期從 11/20 提升到 15/20，應保存的 10 筆內容從保存 2 筆提升到 6 筆；10 筆不應保存的內容都沒有誤收，但仍漏收 4 筆。樣本小，而且由同一團隊出題，不能視為獨立評測或正式品質保證。[完整英文結果與失敗案例](../../evidence/holdout-en-v1/README.md)。

舊規則仍為預設。CLI 加上 `--policy admission-v2-preview` 才使用預覽門檻。

執行 `node src/server.mjs`，開啟 http://127.0.0.1:4175/，即可免費查看四個已記錄案例。若要輸入自己的文字即時測試，改用 `node --env-file=.env src/server.mjs` 啟動。畫面會並排顯示新舊規則，清楚區分歷史結果與即時回應；key 留在本機伺服器，不進入瀏覽器。詳細說明見 [試用指南](../playground.md)。

## 文件與貢獻

首頁新增實驗儀表板，並沿用 Cairn 的紙白、苔綠與字體。追加兩輪相同英文案例後，合計為 **20 個不同案例、60 次評估**：平均回應 289 ms、中位數 271 ms、p95 363 ms；實驗版三輪各有 15、15、14 題符合預期，共 44/60，並有 2 題判斷隨輪次改變。這是重複測試，不能當成 60 個獨立案例。[完整補測報告](../../evidence/repeat-en-v1/README.md)。

上方數字由公開實測資料產生，不會被訪客的即時測試改動。下方 Try it yourself 保留歷史案例與本機即時評估。`web/` 亦可單獨發布為不含 key 的歷史案例展示；公開網域不啟用即時 API，訪客需下載並設定自己的 key 才能測新文字。

英文為主要文件語言，中文 Markdown 放在此目錄，以相互連結切換；目前採手動維護，沒有自動翻譯服務。歡迎提供合成的困難案例，參考 [貢獻指南](../../CONTRIBUTING.md)。

本專案受 [jev-memory](https://github.com/NicolasMontone/jev-memory) 的關卡概念啟發，獨立實作並直接呼叫 TypeSafe API。Cairn Memory 仍負責來源憑證、儲存、版本、修正與遺忘。程式碼採 [MIT License](../../LICENSE)。
