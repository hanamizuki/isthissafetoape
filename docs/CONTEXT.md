# Context：feature/deep-dive-prompt

## 問題背景

使用者在 Report 頁面看完風險評估後，希望能帶著分析結果去找自己的 AI Agent 做更深入的調查。目前沒有方便的方式讓使用者把結構化的分析結果轉交給其他 AI。

需求：在 Report 頁面底部加一個可複製的 Prompt 文字框，內容包含：
1. 我們的初步分析結果（分數、紅旗、正面訊號）
2. 根據弱項動態生成的深入分析建議
3. 引導使用者的 AI Agent 進行驗證和獨立評估的行動框架

## 已完成的實作

**已在 main repo 完成所有程式碼修改，需要搬到此 worktree 的 branch 上。**

修改了 `src/pages/ReportPage.tsx`，新增兩個元件：

### `generateDeepDivePrompt(report: RiskReport): string`（約 80 行）
- **Section 1 — Initial Assessment**：從 report 資料組裝摘要（分數、類別、紅旗、正面訊號）
- **Section 2 — Suggested Deep-Dive Areas**：條件式邏輯，根據各類別分數 < 60% 動態建議方向：
  - Smart Contract 低分 → 建議查審計報告、漏洞、multisig
  - Economic 低分 → 建議查 tokenomics、解鎖時程、流動性
  - Governance 低分 → 建議查治理提案、投票集中度
  - Infrastructure 低分 → 建議查 oracle、bridge、frontend security
  - Project Fundamentals 低分 → 建議查團隊、合規
  - Market 低分 → 建議查競品、成長、合作依賴
  - 有 critical/high 紅旗 → 建議逐一驗證最新狀態
  - 總分 < 40 → 建議研究替代方案
  - 無弱項 → fallback 建議驗證關鍵聲明
- **Section 3 — What I Need You To Do**：4 步行動框架（驗證準確性、深入調查、獨立評估、行動建議）
- Prompt 內文品牌名使用 `IsThisSafeToApe.com`（**注意：UI 上維持 `IsThisSafeToApe`，不加 .com**）

### `DeepDivePrompt` 元件（約 30 行）
- 標題：`TAKE THIS TO YOUR AI AGENT`
- 說明文字 + `COPY PROMPT` 按鈕（複製後變 `COPIED`，2 秒復原）
- `<pre>` 文字框顯示 prompt，`max-h-64 overflow-y-auto`，風格與現有 UI 一致
- 放在 `ReportContent` 的 footer 時間戳上方

### Build 驗證
- `npx vite build` 通過，無錯誤

## 需要修復 / 實作的項目

- [x] 設計 prompt 結構和動態邏輯
- [x] 實作 `generateDeepDivePrompt` 函式
- [x] 實作 `DeepDivePrompt` UI 元件
- [x] 整合到 `ReportContent`
- [x] Build 驗證通過
- [ ] 將 main repo 的改動搬到此 branch（cherry-pick 或手動 apply）
- [ ] Commit + 開 PR

## 關鍵檔案

| 檔案路徑 | 說明 |
|----------|------|
| `src/pages/ReportPage.tsx` | 主要修改檔案，新增 prompt 生成邏輯和 UI 元件 |
| `src/types/risk.ts` | `RiskReport`, `CategoryScore`, `RedFlag` 型別定義（未修改） |

## 目前進度

程式碼已在 main repo 完成並通過 build。需要將改動搬到此 worktree 的 `feature/deep-dive-prompt` branch，然後 commit + 開 PR。

**重要提醒：** 品牌名 `.com` 只出現在 prompt 內文，UI 元素維持 `IsThisSafeToApe`。
