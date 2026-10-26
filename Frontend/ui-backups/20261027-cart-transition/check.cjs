const {chromium}=require('C:/Users/there/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('celestial-theme','light'));
 const product={_id:'p1',title:'The everyday tee',price:{amount:1499,currency:'INR'},images:[{url:'/images/hero-garment.png'}],variants:[{_id:'v1',stock:8,attributes:{size:'M',color:'Charcoal'}}]};
 await page.route('**/api/**',r=>{const path=new URL(r.request().url()).pathname;return r.fulfill({json:path==='/api/auth/me'?{user:{_id:'buyer',role:'buyer'}}:path==='/api/cart/'?{cart:{items:[{_id:'item',product,variants:'v1',quantity:1,price:product.price}]}}:path.includes('/detail/')?{product}:{products:[]}})});
 const panel=page.getByTestId('cart-transition-panel');const main=page.getByTestId('cart-transition-page');
 await page.goto('http://127.0.0.1:5186/');await page.getByRole('link',{name:'Your bag',exact:true}).waitFor();
 await page.getByRole('link',{name:'Your bag',exact:true}).click();await panel.waitFor({state:'visible'});assert.equal(await main.evaluate(e=>e.inert),true);
 await page.waitForTimeout(220);await page.screenshot({path:'ui-backups/20261027-cart-transition/local-enter.png'});
 await page.waitForTimeout(550);assert.ok(Math.abs((await panel.boundingBox()).y)<2,'Panel must cover viewport');assert.equal(await page.evaluate(()=>document.elementFromPoint(innerWidth/2,innerHeight/2).closest('[data-testid=cart-transition-panel]')!==null),true);await page.screenshot({path:'ui-backups/20261027-cart-transition/local-brand.png'});
 await page.waitForURL('**/cart');await panel.waitFor({state:'hidden'});await page.getByRole('heading',{name:'Bag summary'}).waitFor();
 assert.equal(await main.evaluate(e=>e.inert),false);assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('overflow-hidden')),false);assert.equal(await page.evaluate(()=>document.activeElement.tagName),'H1');
 await page.screenshot({path:'ui-backups/20261027-cart-transition/local-finished.png'});
 await page.getByRole('link',{name:'The everyday tee',exact:true}).click();await page.waitForURL('**/product/p1');
 await page.getByRole('link',{name:'Your bag',exact:true}).focus();await page.keyboard.press('Enter');await panel.waitFor({state:'visible'});await page.waitForURL('**/cart');await panel.waitFor({state:'hidden'});
 await page.goBack();await page.waitForURL('**/product/p1');await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('link',{name:'Your bag',exact:true}).click();await page.waitForURL('**/cart');assert.equal(await panel.isVisible(),false);assert.equal(await main.evaluate(e=>e.inert),false);
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goBack();await page.waitForURL('**/product/p1');await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Switch to dark mode'}).click();await page.getByRole('link',{name:'Your bag',exact:true}).click();await panel.waitFor({state:'visible'});assert.equal(await panel.getAttribute('data-theme'),'dark');await page.waitForTimeout(750);await page.screenshot({path:'ui-backups/20261027-cart-transition/local-mobile-brand.png'});await page.waitForURL('**/cart');await panel.waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.reload();await page.getByRole('heading',{name:'Bag summary'}).waitFor();assert.equal(await panel.isVisible(),false);
 assert.deepEqual(errors,[]);console.log('PASS: homepage and product cart links, keyboard activation, covered route swap, focus restoration, scroll unlock, repeat navigation, direct cart load, reduced motion, dark mobile, no page errors.');await browser.close();
})();

