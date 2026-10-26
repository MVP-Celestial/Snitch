const { chromium } = require('C:/Users/there/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1672,height:941},deviceScaleFactor:1});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5186/',{waitUntil:'networkidle'});
 await page.locator('.rack-stage.is-ready').waitFor({timeout:60000});
 await page.waitForTimeout(2500);
 await page.screenshot({path:'hero-backups/20261026-233805/verification/site-dark.png'});
 await page.getByRole('button',{name:'Switch to light mode'}).click();
 await page.waitForTimeout(1500);
 await page.screenshot({path:'hero-backups/20261026-233805/verification/site-light.png'});
 await page.getByRole('button',{name:'Next garment',exact:true}).click();
 await page.waitForTimeout(1400);
 console.log('NEXT',await page.locator('.rack-status').innerText());
 await page.locator('.rack-stage').focus();await page.keyboard.press('Enter');
 await page.locator('.rack-hero.is-preview').waitFor();await page.waitForTimeout(1800);
 await page.screenshot({path:'hero-backups/20261026-233805/verification/site-preview.png'});
 await page.getByRole('button',{name:'Close shirt preview'}).click();
 await page.waitForTimeout(1400);
 console.log('CLOSED',await page.locator('.rack-hero.is-preview').count(),'ERRORS',errors);
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(1500);
 await page.screenshot({path:'hero-backups/20261026-233805/verification/site-mobile.png'});
 console.log('OVERFLOW',await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
 await browser.close();
})();

