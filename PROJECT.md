# 語塊練習 v2 — 專案狀態文件

---

## 啟動方式

```bash
cd "/Users/ina/Documents/01_品牌經營/vocab-cards"
npm install       # 只需做一次
npm run dev       # 啟動開發伺服器
```

瀏覽器開啟 `http://localhost:5173`
**Terminal 視窗必須保持開著，關掉的話網站就會停止。**

---

## 專案當前進度 (Current Progress)

### 背景
v1 版功能過多（內建 N1–N5 題庫、聽力、拖拉重組、選擇題、勳章系統等），
實際使用後發現資訊量過大，沒有真正複習到想記住的東西。

v2 從零重寫，核心理念：
> **只複習自己收藏的內容，用 SRS 讓記憶扎根。**

### 開發階段
- Phase 1（已完成）：CSV/Excel 匯入、Flashcard 翻卡、SRS、首頁
- Phase 2（已完成）：句子語塊框選標記、填空練習、設定頁、Streak
- Phase 3（尚未開始）：AI 語塊練習（需要 Anthropic API）

---

## 已完成事項 (Completed)

### 核心架構
- `src/context/AppContext.jsx` — 全域狀態管理（卡片、SRS、設定、Streak）
- `src/index.css` — 設計系統（CSS 變數、深淺色主題、所有元件樣式）
- `src/App.jsx` — 路由設定（HashRouter，支援靜態部署）
- `src/utils/srs.js` — SRS 工具函式

### 頁面元件
| 檔案 | 功能 |
|------|------|
| `src/components/layout/Header.jsx` | 標題列、語言切換 badge、深淺色切換 |
| `src/components/layout/BottomNav.jsx` | 底部導覽列（含待複習數量紅點） |
| `src/components/home/HomePage.jsx` | 語言選擇、今日待複習數、SRS 分布、Streak |
| `src/components/quiz/QuizPage.jsx` | 翻卡模式 + 填空模式 |
| `src/components/import/ImportPage.jsx` | 三種匯入方式 |
| `src/components/cards/CardListPage.jsx` | 卡片列表、搜尋、詳情、刪除、語塊框選 |
| `src/components/settings/SettingsPage.jsx` | 每日新卡上限、主題、清除資料 |

### 功能細節

**匯入**
- 支援 Excel（.xlsx）與 CSV（.csv）兩種格式
- 統一欄位格式（header-based，支援多種別名）：`word`、`reading`、`meaning`、`example`、`example_translation`、`notes`
- 語言自動偵測（依 `word` 欄位的 Unicode 範圍判斷日文 / 英文）
- 重複卡片偵測：發現重複時彈出確認視窗，可選擇「跳過 / 建立新卡 / 取代舊卡」
- 手動新增（含讀音、例句翻譯、補充說明欄位）
- 提供 CSV 範本下載

**平假名讀音（`reading` 欄位）**
- 日文卡片可填入平假名讀音（手動輸入，不自動生成）
- 手動新增：輸入日文語塊後，自動出現「平假名讀音」輸入框
- CSV/Excel 上傳：填寫 `reading` 欄位即可（例：`建物の中` → `たてものの なか`）
- 讀音以 HTML `<ruby><rt>` 標籤顯示在語塊上方（翻卡背面 + 卡片詳情）
- kuromoji 自動標注因 Vite + Safari 相容性問題（.dat.gz Content-Encoding 雙重解壓縮 bug）放棄，改為手動填寫方式

**複習（SRS）**
- 新卡每天上限（預設 10 張，可設定 5/10/15/20）
- 翻卡：正面中文 → 翻面目標語言 + 讀音（ruby）+ 例句 + 例句翻譯，「記得」/「還不熟」
- 填空：只出現有例句且例句包含 word 的卡片；例句挖空 → 輸入答案 → 支援模糊比對（1 個字元差異容許）
- SRS 間隔：1→2→4→8→16→32→64 天
- 按「記得」累積間隔；按「還不熟」重置為 1 天後

**卡片列表**
- 多選批次刪除（勾選 checkbox + 刪除所選）
- 點開卡片詳情：顯示讀音（ruby 標注）、例句、例句翻譯、補充說明、SRS 狀態
- 搜尋（依單字、中文、例句過濾）

**語塊框選標記**
- 在來源例句上拖選文字 → 輸入中文意思 → 自動建立新語塊卡片
- 已標記語塊在句子中高亮顯示
- 支援手動輸入（備用方式，適用於沒有例句的卡片）
- Safari 相容性修正（加 setTimeout 處理選取時機）

**其他**
- 日文 / 英文題庫完全分開管理
- 深色 / 淺色模式切換
- 連續學習天數（Streak）
- 所有資料僅存於 localStorage，不上傳伺服器

### 已修復的 Bug
- `initSRS` ReferenceError（舊版 ImportPage 移除 import 但仍有呼叫）
- `phrases.js` 第 90 行語法錯誤（物件缺少 `zh:` 屬性）
- Safari 框選語塊無效（選取事件時機問題）
- 重複卡片「取代」時未保留 `reading` 欄位（已修正）

---

## 待辦事項 (To-Do List)

### 短期
- [ ] 測試語塊框選在 Safari 上是否已正常

### Phase 3（未來）
- [ ] AI 語塊練習（使用 Anthropic API `claude-sonnet-4-6`）
  - 用 AI 生成填空題或造句練習
  - 需要使用者在設定頁輸入 API Key

### 功能優化（低優先度）
- [ ] 卡片編輯功能（目前只能刪除，不能修改）
- [ ] 匯出功能（將卡片匯出為 CSV/Excel）
- [ ] 學習統計頁面（30 天圖表、正確率）

---

## 已捨棄 / 不執行的部分 (Dropped / Deprecated)

| 功能 | 原因 |
|------|------|
| 內建 N1–N5 / CEFR 題庫 | v2 核心理念改為「只練自己收藏的內容」 |
| 聽力測驗（TTS） | 非核心功能，暫不實作 |
| 語塊重組拖拉題 | 非核心功能，暫不實作 |
| 四選一選擇題 | 非核心功能，暫不實作 |
| 勳章 / 等級系統 | 過度設計，讓介面變複雜 |
| recharts 圖表套件 | 目前無統計頁，未使用（仍在 package.json 中，可移除）|
| kuromoji 自動振假名 | Vite 開發伺服器將 .dat.gz 以 Content-Encoding: gzip 回傳，瀏覽器自動解壓後 kuromoji 再次解壓失敗（Invalid file signature）；改以手動 `reading` 欄位替代 |
| 舊版 v1 所有元件 | 已全數替換（CardBrowserPage、StatsPage、QuizPage 等舊版本）|

---

## 技術規格

- 框架：React 18 + Vite 5
- 路由：react-router-dom v6（HashRouter）
- 資料：localStorage（`lg2_` 前綴，與 v1 的 `lg_` 隔離）
- Excel 解析：xlsx 套件
- 部署：`npm run build` → 產生 `dist/` 靜態資料夾，可上傳任何靜態主機
