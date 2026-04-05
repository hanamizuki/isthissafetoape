# Context: fix/optimize-mobile-header

## 問題背景
手機版 Header 互動時感覺「卡卡的」（掉幀/不流暢）。原因是多個 GPU-intensive CSS 效果疊加，在手機硬體上造成合成效能瓶頸。

## 根本原因

共 4 個效能瓶頸，依影響程度排列：

### 1. `backdrop-blur-sm`（最大嫌疑）
- **檔案：** `src/pages/HomePage.tsx:36`、`src/pages/ReportPage.tsx:52`、`src/pages/HistoryPage.tsx` 對應行
- **問題：** Header 的 `bg-background/90 backdrop-blur-sm` 在手機上每一幀都要對後方像素做高斯模糊，滑動時嚴重掉幀

### 2. `scanlines::after` 全螢幕 pseudo-element
- **檔案：** `src/index.css:85-98`
- **問題：** `position: fixed; inset: 0; z-index: 9999` 的 CRT 掃描線用 `repeating-linear-gradient` 覆蓋整個畫面，手機上多一層全螢幕合成 layer

### 3. 巨大 blur orbs（裝飾光暈球）
- **檔案：** `src/pages/HomePage.tsx:32-33`（`blur-[120px]` 600px 球 + `blur-[100px]` 500px 球）、`src/pages/ReportPage.tsx:50`
- **問題：** 大面積高斯模糊在手機上拖慢合成速度

### 4. 多層 neon text-shadow / drop-shadow
- **檔案：** `src/index.css:101-106`（`.neon-text-cyan` 3 層 text-shadow）、各頁 Header 的 logo `drop-shadow`
- **問題：** 多層陰影增加 rasterization 成本

## 需要修復 / 實作的項目

用 Tailwind `md:` breakpoint 區分手機/桌面，手機走輕量渲染，桌面保留完整視覺：

1. **backdrop-blur → 不透明背景：** 手機版 Header 改 `bg-background`（不透明），桌面版保留 `md:bg-background/90 md:backdrop-blur-sm`
2. **scanlines → 手機版關閉：** 用 `@media (max-width: 767px)` 隱藏 `.scanlines::after`，或加 `display: none`
3. **blur orbs → 手機版縮小或隱藏：** 手機版加 `hidden md:block`，或大幅縮小尺寸 + 降低 blur 值
4. **neon shadows → 手機版減層：** 手機版 `.neon-text-cyan` 減為 1 層 shadow，用 `@media` 覆寫

## 關鍵檔案

| 檔案路徑 | 說明 |
|---------|------|
| `src/pages/HomePage.tsx` | 主頁 Header（L36-82）+ blur orbs（L32-33） |
| `src/pages/ReportPage.tsx` | 報告頁 Header（L52-64）+ blur orb（L50） |
| `src/pages/HistoryPage.tsx` | 歷史頁 Header（結構同 ReportPage） |
| `src/index.css` | scanlines（L85-98）、neon-text-cyan（L101-106）、neon-box 系列 |

## 目前進度
尚未開始。預計改動約 15-20 行，集中在 CSS media query 和幾個元件的 className。
