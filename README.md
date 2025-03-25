# NUEiP 自動打卡 (AWS Lambda 版本)

利用 AWS Lambda + Puppeteer + Chromium Headless 實現自動登入 NUEiP 並打卡，支援定位與 Discord 通知！

## 📦 架構技術

- AWS Lambda
- Node.js (ESM)
- Puppeteer-Core
- @sparticuz/chromium (headless chrome for AWS Lambda)
- EventBridge 定時觸發

## ⚙️ 使用方式

### 1. Clone 並安裝依賴
```bash
npm install
```

### 2. 設定環境變數
請複製 `.env.example` 並建立 `.env`，填入你自己的 NUEiP 與 Discord 資訊。

### 3. 測試執行（本機）
```bash
node index.mjs
```

### 4. 壓縮部署至 Lambda
將以下檔案壓縮為 `.zip` 上傳 Lambda：
```
index.mjs
node_modules/
package.json
```

記得選擇執行環境為 `Node.js 18.x`，並設定處理常式為：
```
index.handler
```

## 🧩 Layer 使用說明

請加入以下 Layer（已內建 Chromium + Chromedriver）：

```
arn:aws:lambda:us-east-1:764866452798:layer:chrome-aws-lambda:50
```

## 📅 設定排程

使用 EventBridge 建立 Cron 排程，例如每天上班時間 08:30 執行：
```
cron(30 8 ? * MON-FRI *)
```

時區請選擇：
```
Asia/Taipei (UTC+08:00)
```

## 🧪 測試事件 JSON 範例

```json
{
  "PUNCH_TYPE": "上班"
}
```

若不傳此欄位，則會預設使用 `.env` 中的設定值。

## 📁 環境變數範例

請建立 `.env` 檔案，內容如下：

```env
NUEIP_COMPANY_CODE=your_company
NUEIP_ACCOUNT=your_account
NUEIP_PASSWORD=your_password
DISCORD_WEBHOOK=https://discord.com/api/webhooks/...
PUNCH_TYPE=上班
```
