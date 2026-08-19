import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

  try {
    console.log("Navigating to login page...");
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

    console.log("Logging in as worker A...");
    // Just click the button containing the text
    await page.click('button:has-text("보조원 A")');
    await page.click('button:has-text("확인원 로그인")');
    await page.waitForTimeout(4000);

    await page.screenshot({ path: 'scripts/worker-step1-login.png' });
    console.log("Took screenshot of login result.");

    const guideVisible = await page.$('text="업무 가이드"');
    if (guideVisible) {
      console.log("Work guide is visible. Clicking checkboxes...");
      const agreeAll = await page.$('text="모두 동의"');
      if (agreeAll) {
        await agreeAll.click();
      } else {
        const checkboxes = await page.$$('input[type="checkbox"]');
        for (const cb of checkboxes) {
           await cb.click();
        }
      }
      
      const submitBtn = await page.$('button:has-text("제출")');
      if (submitBtn) {
        await submitBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    await page.screenshot({ path: 'scripts/worker-step2-home.png' });
    console.log("Took screenshot of home screen.");

    const cards = await page.$$('div.cursor-pointer');
    if (cards.length > 0) {
      console.log(`Found ${cards.length} task cards. Clicking the first one...`);
      await cards[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'scripts/worker-step3-detail.png' });
      console.log("Took screenshot of detail modal.");
    } else {
      console.log("No task cards found.");
    }

  } catch (error) {
    console.error("Test failed:", error);
    await page.screenshot({ path: 'scripts/worker-error.png' });
  } finally {
    await browser.close();
    console.log("Test completed.");
  }
})();
