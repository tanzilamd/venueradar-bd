import {chromium,expect} from '@playwright/test';
const url=process.argv[2];if(!url)throw Error('Supply a local build or actual deployment URL');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));const response=await page.goto(url);expect(response.status()).toBe(200);
 const data=await page.evaluate(async()=>{const r=await fetch('./data/venues.json');if(!r.ok)throw Error('Venue JSON failed');return r.json();});expect(data.length).toBeGreaterThan(0);
 await expect(page.locator('.card')).toHaveCount(data.length);expect(await page.locator('body').innerText()).not.toMatch(/[\u0980-\u09ff]/);
 await page.locator('#search').fill('Sheraton');await expect(page.locator('.card')).toHaveCount(1);await page.locator('.save').click();await page.reload();await expect(page.locator('#savedCount')).toHaveText('1');
 await page.locator('#area').selectOption('Banani');await expect(page.locator('.card')).toHaveCount(1);await page.getByRole('button',{name:'View details',exact:true}).click();await expect(page.locator('dialog a[href^="tel:"]')).toHaveAttribute('href','tel:+880255668111');await expect(page.locator('dialog a[href^="https://www.google.com/maps/"]')).toBeVisible();await page.keyboard.press('Escape');
 await page.locator('#reset').click();await page.getByRole('button',{name:'Compare +',exact:true}).first().click();await page.getByRole('button',{name:'Compare +',exact:true}).first().click();await page.locator('#openCompare').click();await expect(page.locator('table')).toBeVisible();await page.keyboard.press('Escape');
 await page.locator('#mapView').click();await expect(page.locator('.leaflet-container')).toBeVisible();await expect.poll(async()=>page.evaluate(()=>document.querySelectorAll('.venue-marker').length+[...document.querySelectorAll('.marker-cluster span')].reduce((n,s)=>n+Number(s.textContent),0))).toBe(data.filter(v=>v.coordinates).length);expect(errors).toEqual([]);
 await page.screenshot({path:'/tmp/venueradar-production-smoke.png',fullPage:true});console.log(JSON.stringify({url,httpStatus:response.status(),records:data.length,checks:'English UI, search, neighborhood, details, phone, review link, favorites reload, comparison, map markers',pageErrors:errors}));
}finally{await browser.close();}
