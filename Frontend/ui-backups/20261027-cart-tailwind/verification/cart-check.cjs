const {chromium}=require('C:/Users/there/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('celestial-theme','light'));
 let state='filled', failUpdate=false, updates=0;
 const product=(id,title,amount,currency='INR')=>({_id:id,title,price:{amount,currency},images:[{url:'/images/hero-garment.png'}],variants:[{_id:'v'+id,stock:8,attributes:{size:'M',color:'Charcoal'}}]});
 let items=[{_id:'a',product:product('p1','The everyday tee',1499),variants:'vp1',quantity:2,price:{amount:1499,currency:'INR'}},{_id:'b',product:product('p2','The essential oversized tee',1899),variants:'vp2',quantity:1,price:{amount:1899,currency:'INR'}}];
 await page.route('**/api/**',async route=>{const u=new URL(route.request().url());const json=data=>route.fulfill({json:data});
  if(u.pathname==='/api/auth/me')return json({user:{_id:'buyer',role:'buyer',fullname:'Demo Buyer'}});
  if(u.pathname.startsWith('/api/cart/quantity/increment/')){assert.equal(route.request().method(),'PATCH');assert.match(u.pathname,/p1\/vp1$/);updates++;if(failUpdate)return route.fulfill({status:400,json:{message:'Only 0 items left in stock'}});items[0].quantity++;return json({success:true});}
  if(u.pathname==='/api/cart/'){if(state==='error')return route.fulfill({status:500,json:{message:'Cart is temporarily unavailable'}});if(state==='loading')await new Promise(r=>setTimeout(r,1000));return json({cart:{items:state==='empty'?[]:items}});}
  return json({products:[]});
 });
 await page.goto('http://127.0.0.1:5186/cart');await page.getByRole('heading',{name:'Bag summary'}).waitFor();
 assert.equal(await page.locator('[data-testid=cart-item]').count(),2);assert.match(await page.locator('[data-testid=cart-total]').innerText(),/4,897/);
 await page.screenshot({path:'ui-backups/20261027-cart-tailwind/verification/cart-light.png',fullPage:true});
 await page.getByRole('button',{name:'Increase quantity of The everyday tee',exact:true}).click();await page.getByText('The everyday tee quantity updated.',{exact:true}).waitFor();assert.equal(updates,1);assert.match(await page.locator('[data-testid=cart-total]').innerText(),/6,396/);
 failUpdate=true;await page.getByRole('button',{name:'Increase quantity of The everyday tee',exact:true}).click();await page.getByRole('alert').getByText('Only 0 items left in stock').waitFor();assert.equal(await page.getByRole('button',{name:'Checkout coming soon'}).isDisabled(),true);
 await page.getByRole('button',{name:'Switch to dark mode'}).click();await page.screenshot({path:'ui-backups/20261027-cart-tailwind/verification/cart-dark.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'ui-backups/20261027-cart-tailwind/verification/cart-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 state='empty';await page.reload();await page.getByRole('heading',{name:'Your next favourite is waiting.'}).waitFor();await page.screenshot({path:'ui-backups/20261027-cart-tailwind/verification/cart-empty.png',fullPage:true});
 state='error';await page.reload();await page.getByRole('heading',{name:'Your bag needs a moment.'}).waitFor();state='filled';await page.getByRole('button',{name:'Try again',exact:true}).click();await page.getByRole('heading',{name:'Bag summary'}).waitFor();
 items.push({_id:'c',product:product('p3','Different currency',20,'USD'),variants:'vp3',quantity:1,price:{amount:20,currency:'USD'}});await page.reload();await page.getByRole('heading',{name:'Bag summary'}).waitFor();assert.equal(await page.locator('[data-testid=cart-total] strong').count(),2);
 state='loading';await page.reload();await page.getByRole('status',{name:'Loading your bag'}).waitFor();await page.getByRole('heading',{name:'Bag summary'}).waitFor();
 await page.unroute('**/api/**');await page.route('**/api/**',route=>route.fulfill({status:401,json:{message:'Sign in'}}));await page.reload();await page.waitForURL('**/login');assert.equal(errors.length,0,errors.join('\n'));
 console.log('PASS: light/dark, quantity API and refreshed totals, stock error, empty/loading/error/retry, multiple currencies, mobile overflow, unauthenticated redirect. No page errors.');
 await browser.close();
})();

