const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  console.log('Starting Field-Master asset generation...');
  const browser = await chromium.launch();

  // 1. Generate 512x512 Icon
  const iconPage = await browser.newPage({ viewport: { width: 512, height: 512 } });
  const iconHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            width: 512px;
            height: 512px;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          }
          .icon-box {
            width: 470px;
            height: 470px;
            border-radius: 110px;
            background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 0 20px 45px rgba(37, 99, 235, 0.35);
            position: relative;
          }
          .inner-glow {
            position: absolute;
            top: 0; left: 0; right: 0; height: 50%;
            background: linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 100%);
            border-radius: 110px 110px 0 0;
          }
          .badge {
            width: 170px;
            height: 170px;
            background: rgba(255, 255, 255, 0.12);
            border: 2px solid rgba(255, 255, 255, 0.25);
            border-radius: 46px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 24px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
            backdrop-filter: blur(10px);
          }
          .badge svg {
            width: 100px;
            height: 100px;
            fill: none;
            stroke: #38bdf8;
            stroke-width: 2.2;
            stroke-linecap: round;
            stroke-linejoin: round;
          }
          .title {
            color: #ffffff;
            font-size: 64px;
            font-weight: 900;
            letter-spacing: -2px;
            text-shadow: 0 4px 12px rgba(0,0,0,0.3);
          }
          .sub {
            color: #93c5fd;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-top: 6px;
          }
        </style>
      </head>
      <body>
        <div class="icon-box">
          <div class="inner-glow"></div>
          <div class="badge">
            <svg viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="2" fill="rgba(56,189,248,0.2)" stroke="#38bdf8" />
              <path d="m9 14 2 2 4-4" stroke="#4ade80" stroke-width="2.6" />
            </svg>
          </div>
          <div class="title">FM</div>
          <div class="sub">Field Master</div>
        </div>
      </body>
    </html>
  `;
  await iconPage.setContent(iconHtml, { waitUntil: 'load' });
  const icon512Path = path.resolve('public/icons/icon-512.png');
  await iconPage.screenshot({ path: icon512Path });
  console.log('Saved:', icon512Path);

  // 2. Generate 192x192 Icon
  const icon192Page = await browser.newPage({ viewport: { width: 192, height: 192 } });
  const icon192Html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            width: 192px;
            height: 192px;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .icon-box {
            width: 176px;
            height: 176px;
            border-radius: 42px;
            background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .badge svg {
            width: 54px;
            height: 54px;
            fill: none;
            stroke: #38bdf8;
            stroke-width: 2.2;
            stroke-linecap: round;
            stroke-linejoin: round;
          }
          .title {
            color: #ffffff;
            font-size: 34px;
            font-weight: 900;
            letter-spacing: -1px;
            line-height: 1;
            margin-top: 4px;
          }
          .sub {
            color: #93c5fd;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-top: 4px;
          }
        </style>
      </head>
      <body>
        <div class="icon-box">
          <div class="badge">
            <svg viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="2" fill="rgba(56,189,248,0.2)" stroke="#38bdf8" />
              <path d="m9 14 2 2 4-4" stroke="#4ade80" stroke-width="2.6" />
            </svg>
          </div>
          <div class="title">FM</div>
          <div class="sub">Field Master</div>
        </div>
      </body>
    </html>
  `;
  await icon192Page.setContent(icon192Html, { waitUntil: 'load' });
  const icon192Path = path.resolve('public/icons/icon-192.png');
  await icon192Page.screenshot({ path: icon192Path });
  console.log('Saved:', icon192Path);

  // 3. Generate OG Image (1200x630)
  const ogPage = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  const ogHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            width: 1200px;
            height: 630px;
            background: linear-gradient(135deg, #090d16 0%, #0f172a 40%, #1e3a8a 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, "Pretendard", "Segoe UI", Roboto, sans-serif;
            position: relative;
            overflow: hidden;
          }
          .grid {
            position: absolute;
            inset: 0;
            background-image: 
              radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.05) 2%, transparent 0%),
              radial-gradient(circle at 75px 75px, rgba(59, 130, 246, 0.08) 2%, transparent 0%);
            background-size: 100px 100px;
          }
          .glow {
            position: absolute;
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, rgba(0,0,0,0) 70%);
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          }
          .card {
            position: relative;
            z-index: 10;
            background: rgba(15, 23, 42, 0.75);
            border: 1px solid rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(20px);
            border-radius: 36px;
            padding: 56px 80px;
            display: flex;
            flex-direction: column;
            align-items: center;
            box-shadow: 0 30px 70px rgba(0, 0, 0, 0.6);
            max-width: 960px;
            width: 90%;
            text-align: center;
          }
          .badge-row {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            background: rgba(37, 99, 235, 0.2);
            border: 1px solid rgba(59, 130, 246, 0.4);
            padding: 10px 24px;
            border-radius: 999px;
            margin-bottom: 24px;
          }
          .badge-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #22c55e;
            box-shadow: 0 0 10px #22c55e;
          }
          .badge-text {
            color: #93c5fd;
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 0.5px;
          }
          h1 {
            color: #ffffff;
            font-size: 68px;
            font-weight: 900;
            letter-spacing: -2px;
            margin-bottom: 16px;
            line-height: 1.15;
          }
          h1 span {
            background: linear-gradient(135deg, #60a5fa 0%, #38bdf8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          p {
            color: #cbd5e1;
            font-size: 26px;
            font-weight: 500;
            line-height: 1.5;
            margin-bottom: 28px;
          }
          .footer-note {
            color: #64748b;
            font-size: 16px;
            font-weight: 500;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding-top: 18px;
            width: 100%;
          }
        </style>
      </head>
      <body>
        <div class="grid"></div>
        <div class="glow"></div>
        <div class="card">
          <div class="badge-row">
            <div class="badge-dot"></div>
            <div class="badge-text">B2B FIELD WORK SOLUTION</div>
          </div>
          <h1>Field-Master <span>(FM)</span></h1>
          <p>스마트 현장조사 및 실태관리 업무지원 솔루션</p>
          <div class="footer-note">
            차세대 실태확인 · 실시간 관제 · 결과 보고 자동화 플랫폼
          </div>
        </div>
      </body>
    </html>
  `;
  await ogPage.setContent(ogHtml, { waitUntil: 'load' });
  const ogPath = path.resolve('app/opengraph-image.png');
  await ogPage.screenshot({ path: ogPath });
  console.log('Saved:', ogPath);

  await browser.close();
  console.log('All assets generated successfully!');
})();
