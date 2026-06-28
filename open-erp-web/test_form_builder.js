const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACTS = 'C:/Users/Minh/.gemini/antigravity-ide/brain/b0d707cf-d281-4fa5-b1f9-6c23b54f6256';

(async () => {
  const browser = await puppeteer.launch({ 
    headless: true, 
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const results = [];
  const log = (msg) => { console.log(msg); results.push(msg); };

  try {
    // Step 1: Load page
    log('=== STEP 1: Loading form builder page ===');
    await page.goto('http://localhost:4200/admin/form-builder', { waitUntil: 'networkidle0', timeout: 20000 });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: `${ARTIFACTS}/test_01_initial.png` });

    const title = await page.$eval('h1', el => el.textContent.trim()).catch(() => 'NOT FOUND');
    log(`Page title: ${title}`);

    const emptyMsg = await page.$eval('[class*="download-cloud"]', el => el.closest('div').textContent.trim()).catch(() => null);
    if (emptyMsg) log('PASS: Empty state message visible');
    else log('INFO: Canvas may already have content');

    // Step 2: Click "Phân khu (Panel)"
    log('\n=== STEP 2: Click Panel palette item ===');
    const panelBtn = await page.evaluateHandle(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      return spans.find(s => s.textContent.includes('Phân khu'));
    });
    
    if (panelBtn.asElement()) {
      const el = panelBtn.asElement().closest('div[class*="border"]') || panelBtn.asElement();
      await el.click();
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: `${ARTIFACTS}/test_02_panel_added.png` });
      
      const panelHeader = await page.$eval('h3', el => el.textContent.trim()).catch(() => null);
      if (panelHeader) log(`PASS: Panel added - "${panelHeader}"`);
      else log('FAIL: Panel header not found after clicking');
    } else {
      log('FAIL: Panel palette item not found');
    }

    // Step 3: Click palette item - "Văn bản ngắn"
    log('\n=== STEP 3: Click "Văn bản ngắn" palette item ===');
    const textBtn = await page.evaluateHandle(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      return spans.find(s => s.textContent.trim() === 'Văn bản ngắn');
    });
    
    if (textBtn.asElement()) {
      const el = textBtn.asElement().closest('div[class*="border"]') || textBtn.asElement();
      await el.click();
      await new Promise(r => setTimeout(r, 1000));
      
      // Click "Trường số"
      const numBtn = await page.evaluateHandle(() => {
        const spans = Array.from(document.querySelectorAll('span'));
        return spans.find(s => s.textContent.trim() === 'Trường số');
      });
      if (numBtn.asElement()) {
        const numEl = numBtn.asElement().closest('div[class*="border"]') || numBtn.asElement();
        await numEl.click();
        await new Promise(r => setTimeout(r, 500));
      }
      
      await page.screenshot({ path: `${ARTIFACTS}/test_03_fields_added.png` });
      const fieldCountEl = await page.$eval('span[class*="rounded-full"]', el => el.textContent.trim()).catch(() => null);
      log(`Field count badge: ${fieldCountEl}`);
      log('Fields added - check screenshot test_03_fields_added.png');
    } else {
      log('FAIL: "Văn bản ngắn" palette item not found');
    }

    // Step 4: Click on a field in canvas to select it
    log('\n=== STEP 4: Select a field card ===');
    const fieldCards = await page.$$('h4');
    if (fieldCards.length > 0) {
      await fieldCards[0].click();
      await new Promise(r => setTimeout(r, 800));
      await page.screenshot({ path: `${ARTIFACTS}/test_04_field_selected.png` });
      
      // Check right panel content
      const tabs = await page.$$eval('button[class*="border-b-2"]', btns => btns.map(b => b.textContent.trim()));
      log(`Right panel tabs visible: [${tabs.join(', ')}]`);
      
      // Check general tab has inputs
      const labelInput = await page.$('input[type="text"]');
      if (labelInput) log('PASS: Properties panel shows text inputs');
      else log('FAIL: Properties panel has no text inputs');
    } else {
      log('INFO: No field cards found - fields may be in panel or top-level zone');
    }

    // Step 5: Click panel header to select panel
    log('\n=== STEP 5: Select panel to configure columns ===');
    const h3s = await page.$$('h3');
    if (h3s.length > 0) {
      await h3s[0].click();
      await new Promise(r => setTimeout(r, 800));
      await page.screenshot({ path: `${ARTIFACTS}/test_05_panel_selected.png` });
      
      const selectEl = await page.$('select');
      if (selectEl) {
        const options = await page.$$eval('select option', opts => opts.map(o => o.textContent.trim()));
        log(`Panel config select options: [${options.slice(0,4).join(' | ')}]`);
        log('PASS: Panel properties panel shows select for columns');
      } else {
        log('FAIL: No select element found when panel selected');
      }
    }

    // Step 6: Switch to Preview mode
    log('\n=== STEP 6: Switch to Preview mode ===');
    const previewBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent.trim() === 'Xem thử');
    });
    
    if (previewBtn.asElement()) {
      await previewBtn.asElement().click();
      await new Promise(r => setTimeout(r, 1500));
      await page.screenshot({ path: `${ARTIFACTS}/test_06_preview.png` });
      log('PASS: Switched to preview mode');
    } else {
      log('FAIL: Preview button not found');
    }

    // Final screenshot
    await page.screenshot({ path: `${ARTIFACTS}/test_07_final.png` });
    log('\n=== All tests complete ===');

  } catch (err) {
    log(`ERROR: ${err.message}`);
    await page.screenshot({ path: `${ARTIFACTS}/test_error.png` }).catch(() => {});
  }

  await browser.close();
  
  // Write report
  fs.writeFileSync(`${ARTIFACTS}/manual_test_report.txt`, results.join('\n'));
  console.log('\n--- FULL REPORT ---');
  console.log(results.join('\n'));
})();
