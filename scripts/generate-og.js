const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  try {
    const logoPath = './public/nts-logo-real.jpg';
    const logoBase64 = fs.readFileSync(logoPath, 'base64');
    const logoSrc = 'data:image/jpeg;base64,' + logoBase64;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
            body {
              margin: 0;
              padding: 0;
              width: 1200px;
              height: 630px;
              background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              font-family: 'Pretendard', sans-serif;
              color: white;
            }
            .card {
              background: white;
              border-radius: 40px;
              padding: 60px 120px;
              display: flex;
              flex-direction: column;
              align-items: center;
              box-shadow: 0 20px 50px rgba(0,0,0,0.4);
            }
            img {
              width: 350px;
              height: auto;
              margin-bottom: 50px;
            }
            h1 {
              font-size: 90px;
              font-weight: 900;
              color: #1e3a8a;
              margin: 0;
              letter-spacing: -3px;
            }
            p {
              font-size: 36px;
              color: #64748b;
              margin-top: 25px;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <img src="${logoSrc}" />
            <h1>실태확인원</h1>
            <p>현장조사 및 실태확인 시스템</p>
          </div>
        </body>
      </html>
    `;

    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    
    // Set content and wait for network idle to ensure fonts load
    await page.setContent(html, { waitUntil: 'networkidle' });
    
    await page.screenshot({ path: 'app/opengraph-image.png' });
    await browser.close();
    console.log('OG Image generated successfully!');
  } catch (error) {
    console.error('Error generating OG image:', error);
  }
})();
