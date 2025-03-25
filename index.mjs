import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import fetch from 'node-fetch';

const COMPANY_CODE = process.env.NUEIP_COMPANY_CODE;
const ACCOUNT = process.env.NUEIP_ACCOUNT;
const PASSWORD = process.env.NUEIP_PASSWORD;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;
const LATITUDE = parseFloat(process.env.LATITUDE);
const LONGITUDE = parseFloat(process.env.LONGITUDE);

export const handler = async (event) => {
  const punchType = event.PUNCH_TYPE || process.env.PUNCH_TYPE || '上班';

  if (await isTodayHoliday()) {
    await notifyDiscord('🎌 今天是休假日，不打卡');
    return 'Holiday';
  }

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  const page = await browser.newPage();

  // 設定模擬定位
  await page.setGeolocation({ latitude: LATITUDE, longitude: LONGITUDE });
  await page.emulateTimezone('Asia/Tokyo');

  try {
    console.log('🔐 登入 NUEiP...');
    await page.goto('https://portal.nueip.com/login', { waitUntil: 'networkidle2' });

    await page.type('input[name="inputCompany"]', COMPANY_CODE);
    await page.type('input[name="inputID"]', ACCOUNT);
    await page.type('input[name="inputPassword"]', PASSWORD);
    await page.click('.login-button');

    await page.waitForSelector('span.por-button__slot', { timeout: 10000 });

    // 直接點擊「上班」或「下班」按鈕
    const buttonXPath = `//span[contains(text(), "${punchType}")]/ancestor::button[1]`;
    await page.waitForXPath(buttonXPath, { timeout: 10000 });
    const [button] = await page.$x(buttonXPath);
    
    if (!button) {
      throw new Error(`找不到 "${punchType}" 按鈕`);
    }

    await button.click();
    console.log(`✅ 已完成 ${punchType} 打卡`);

    await notifyDiscord(`✅ 成功完成「${punchType}」打卡（位置：新一軍食堂）`);
    return '打卡成功';
  } catch (err) {
    console.error('❌ 錯誤：', err);
    await notifyDiscord(`❌ 打卡失敗：${err.message}`);
    throw err;
  } finally {
    await browser.close();
  }
};

async function notifyDiscord(message) {
  try {
    const res = await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    });
    console.log('📬 Discord 通知狀態碼：', res.status);
  } catch (err) {
    console.error('❌ 通知 Discord 失敗：', err);
  }
}

async function isTodayHoliday() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  const url = `https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data/${yyyy}.json`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const todayInfo = data.find(d => d.date === dateStr);
    return todayInfo?.isHoliday || false;
  } catch (err) {
    console.error('❌ 查詢公休日錯誤：', err);
    return false;
  }
}
