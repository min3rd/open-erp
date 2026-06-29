const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACTS = 'C:/Users/Minh/.gemini/antigravity-ide/brain/f8ffca25-8b3e-4761-9c23-451c00cb0fe3';

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
    await page.goto('http://localhost:4200/admin/form-builder', { waitUntil: 'networkidle0', timeout: 25000 });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: `${ARTIFACTS}/test_01_initial.png` });

    const title = await page.$eval('h1', el => el.textContent.trim()).catch(() => 'NOT FOUND');
    log(`Page title: ${title}`);

    const emptyMsg = await page.$eval('[class*="download-cloud"]', el => el.closest('div').textContent.trim()).catch(() => null);
    if (emptyMsg) log('PASS: Empty state message visible');
    else log('INFO: Canvas may already have content');

    // Step 2: Click "Toàn chiều rộng" panel layout template
    log('\n=== STEP 2: Click Panel palette item ===');
    const panelBtn = await page.evaluateHandle(() => {
      const spans = Array.from(document.querySelectorAll('.oerp-fb-template-name'));
      const span = spans.find(s => s.textContent.includes('Toàn chiều rộng'));
      return span ? span.closest('.oerp-fb-template-card') : null;
    });
    
    if (panelBtn.asElement()) {
      await panelBtn.asElement().click();
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
      const spans = Array.from(document.querySelectorAll('.oerp-fb-palette-item-label'));
      const span = spans.find(s => s.textContent.trim() === 'Văn bản ngắn');
      return span ? span.closest('.oerp-fb-field-palette-item') : null;
    });
    
    if (textBtn.asElement()) {
      await textBtn.asElement().click();
      await new Promise(r => setTimeout(r, 1000));
      
      // Click "Trường số"
      const numBtn = await page.evaluateHandle(() => {
        const spans = Array.from(document.querySelectorAll('.oerp-fb-palette-item-label'));
        const span = spans.find(s => s.textContent.trim() === 'Trường số');
        return span ? span.closest('.oerp-fb-field-palette-item') : null;
      });
      if (numBtn.asElement()) {
        await numBtn.asElement().click();
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
    const fieldCards = await page.$$('.oerp-fb-field-card');
    if (fieldCards.length > 0) {
      await fieldCards[0].click();
      await new Promise(r => setTimeout(r, 800));
      await page.screenshot({ path: `${ARTIFACTS}/test_04_field_selected.png` });
      
      // Check right panel content
      const tabs = await page.$$eval('.oerp-fb-prop-tab', btns => btns.map(b => b.textContent.trim()));
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
    const panelHeaders = await page.$$('.oerp-fb-panel-header');
    if (panelHeaders.length > 0) {
      await panelHeaders[0].click();
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
