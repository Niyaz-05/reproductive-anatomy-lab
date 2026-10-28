import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';

const SHOTS = 'docs/screenshots';
fs.mkdirSync(SHOTS, { recursive: true });

async function open(page: Page, query = '') {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`/${query}`);
  return errors;
}
async function ready(page: Page) {
  await expect(page.locator('.viewer[data-ready="true"]')).toBeVisible({ timeout: 120_000 });
  await settle(page);
}
/** Waits until the canvas has rendered two more frames (software WebGL can be slow to compile shaders). */
async function settle(page: Page, ms = 1000) {
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.waitForTimeout(ms);
}
const detailTitle = (page: Page) => page.locator('#detail-title');
/** A structure-list button by its label; a hidden structure's button adds "hidden" after it. */
const listButton = (page: Page, name: RegExp) => {
  const exact = name.source.endsWith('$') ? new RegExp(`${name.source.slice(0, -1)}\\s*(hidden)?$`) : name;
  return page.locator('.structure-panel .struct-list button', { hasText: exact });
};
const radio = (page: Page, name: string) => page.getByRole('radio', { name, exact: true });
const mode = (page: Page, name: string) => page.locator('nav[aria-label="Mode"] button', { hasText: new RegExp(`^${name.replace(/[&]/g, '\\$&')}$`) }).click();
const cameraButton = (page: Page, name: string) => page.locator('[aria-label="Camera views"] button', { hasText: new RegExp(`^${name}$`) });
const slider = (page: Page, name: RegExp) => page.getByRole('slider', { name });
const attr = async (page: Page, sel: string, a: string) => (await page.locator(sel).first().getAttribute(a)) ?? '';
const num = async (page: Page, sel: string, a: string) => Number(await attr(page, sel, a));
const pause = async (page: Page) => { const b = page.locator('aside.right').getByRole('button', { name: 'Pause' }); if (await b.count()) await b.click(); };
const body = (page: Page, name: 'Female' | 'Male') => expect(radio(page, name)).toHaveAttribute('aria-checked', 'true');

test('loads the female body without console errors and with a clean main screen @smoke', async ({ page }) => {
  const errors = await open(page);
  await ready(page);
  await expect(page.getByRole('heading', { name: 'Reproductive System', level: 1 })).toBeVisible();
  await body(page, 'Female');
  await expect(page.locator('aside.right')).toHaveCount(0);
  await expect(radio(page, 'Real')).toHaveAttribute('aria-checked', 'true');
  await page.screenshot({ path: `${SHOTS}/01-female.png` });
  expect(errors).toEqual([]);
});

test('clicking the model selects the structure under the pointer', async ({ page }) => {
  await open(page);
  await ready(page);
  const box = (await page.locator('.viewer canvas').boundingBox())!;
  const x = box.x + 318 + (box.width - 318) / 2;
  for (const f of [0.5, 0.45, 0.55, 0.6, 0.4, 0.65]) {
    await page.mouse.click(x, box.y + box.height * f);
    if (await detailTitle(page).count()) break;
  }
  await expect(detailTitle(page)).toHaveText(/./);
  await expect(page.locator('aside.right')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/02-selected.png` });
});

test('search finds structures by name and synonym', async ({ page }) => {
  await open(page);
  await ready(page);
  const search = page.getByLabel('Search structures');
  await search.fill('womb');
  await search.press('Enter');
  await expect(detailTitle(page)).toHaveText('Uterus');
  await search.fill('fallopian');
  await expect(page.locator('.search-results')).toContainText('Uterine tube');
  await search.fill('Bartholin');
  await expect(page.locator('.search-results')).toContainText('Greater vestibular gland');
  await search.fill('zzzz');
  await expect(page.getByText('No structure matches')).toBeVisible();
  await search.press('Escape');
  await expect(page.locator('fieldset.layers')).toBeVisible();
});

test('the uterus lists its parts, a part links back, and modelled parts say so', async ({ page }) => {
  await open(page);
  await ready(page);
  await listButton(page, /^Uterus$/).click();
  await expect(detailTitle(page)).toHaveText('Uterus');
  await expect(page.locator('aside.right')).toContainText('7 parts');
  await page.locator('aside.right').getByRole('button', { name: 'Cervix', exact: true }).click();
  await expect(detailTitle(page)).toHaveText('Cervix');
  await page.locator('aside.right').getByRole('button', { name: 'Uterus', exact: true }).click();
  await expect(detailTitle(page)).toHaveText('Uterus');
  await listButton(page, /^Endometrium$/).click();
  await page.locator('aside.right summary').click();
  await expect(page.locator('aside.right .model-note')).toContainText('Modelled');
  await page.screenshot({ path: `${SHOTS}/03-detail.png` });
});

test('a homologue opens its partner in the other body', async ({ page }) => {
  const errors = await open(page);
  await ready(page);
  await listButton(page, /^Ovary \(left\)$/).click();
  await expect(detailTitle(page)).toHaveText('Ovary (left)');
  await page.getByRole('button', { name: /Homologue: Testis \(left\)/ }).click();
  await body(page, 'Male');
  await expect(detailTitle(page)).toHaveText('Testis (left)');
  await ready(page);
  await page.screenshot({ path: `${SHOTS}/04-homologue.png` });
  expect(errors).toEqual([]);
});

test('colour by layers and by origin repaint the model', async ({ page }) => {
  await open(page);
  await ready(page);
  const canvas = page.locator('.viewer canvas');
  const real = await canvas.screenshot();
  await radio(page, 'Layers').click();
  await settle(page, 1200);
  const layers = await canvas.screenshot();
  expect(Buffer.compare(real, layers)).not.toBe(0);
  await radio(page, 'Origin').click();
  await settle(page, 1200);
  expect(Buffer.compare(layers, await canvas.screenshot())).not.toBe(0);
  await expect(page.locator('.structure-panel .legend-row')).toContainText('Müllerian duct');
  await page.screenshot({ path: `${SHOTS}/05-origin.png` });
});

test('layers hide and show structures', async ({ page }) => {
  await open(page);
  await ready(page);
  await page.getByLabel('Uterus', { exact: true }).uncheck();
  await expect(listButton(page, /^Fundus of the uterus/)).toContainText('hidden');
  await page.getByLabel('Pregnancy', { exact: true }).check();
  await expect(listButton(page, /^Placenta/)).not.toContainText('hidden');
});

test('isolate, zoom and reset', async ({ page }) => {
  await open(page);
  await ready(page);
  await listButton(page, /^Ovary \(right\)$/).click();
  await page.getByLabel('Isolate').check();
  await expect(listButton(page, /^Uterus$/)).toContainText('hidden');
  await page.getByRole('button', { name: 'Zoom to' }).click();
  await settle(page, 1000);
  await page.screenshot({ path: `${SHOTS}/06-isolate.png` });
  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(page.locator('aside.right')).toHaveCount(0);
  await expect(listButton(page, /^Uterus$/)).not.toContainText('hidden');
});

test('camera presets and region buttons change the view', async ({ page }) => {
  await open(page);
  await ready(page);
  const canvas = page.locator('.viewer canvas');
  const before = await canvas.screenshot();
  await cameraButton(page, 'Back').click();
  await expect(cameraButton(page, 'Back')).toHaveAttribute('aria-pressed', 'true');
  await settle(page, 1500);
  const back = await canvas.screenshot();
  expect(Buffer.compare(before, back)).not.toBe(0);
  await page.locator('[aria-label="Fly to a region"] button', { hasText: /^Breasts$/ }).click();
  await settle(page, 1500);
  expect(Buffer.compare(back, await canvas.screenshot())).not.toBe(0);
});

test('labels mode shows non-overlapping labels', async ({ page }) => {
  await open(page);
  await ready(page);
  await page.getByLabel('Labels').check();
  await settle(page, 1500);
  const shown = page.locator('.scene-label[data-state="shown"]');
  expect(await shown.count()).toBeGreaterThanOrEqual(3);
  const boxes = await shown.evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => [r.left, r.top, r.right, r.bottom]));
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const [a, b] = [boxes[i]!, boxes[j]!];
    expect(!(a[2]! <= b[0]! || b[2]! <= a[0]! || a[3]! <= b[1]! || b[3]! <= a[1]!), `labels ${i} and ${j} overlap`).toBe(false);
  }
  await page.screenshot({ path: `${SHOTS}/07-labels.png` });
});

test('the cut opens the uterus to its walls and lining, faces the camera, flips and turns off', async ({ page }) => {
  const errors = await open(page);
  await ready(page);
  await radio(page, 'Side').click();
  await expect(cameraButton(page, 'Left side')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.slice-hint')).toHaveText('Showing the right side of the body');
  await expect(listButton(page, /^Anterior wall of the uterus/)).not.toContainText('hidden');
  await expect(listButton(page, /^Body of the uterus/)).toContainText('hidden');
  await settle(page, 2500);
  await page.screenshot({ path: `${SHOTS}/08-cut.png` });
  await page.getByRole('button', { name: 'Flip' }).click();
  await expect(page.locator('.slice-hint')).toHaveText('Showing the left side of the body');
  await radio(page, 'Off').click();
  await expect(page.getByLabel('Cut position')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Cycle: the surge and ovulation, the luteal phase, the pill and PCOS', async ({ page }) => {
  test.slow();
  const errors = await open(page);
  await ready(page);
  await mode(page, 'Cycle');
  await pause(page);
  const day = slider(page, /Day of the cycle/);
  await day.fill('3');
  expect(await num(page, '[data-endometrium]', 'data-endometrium')).toBeLessThan(4);
  await day.fill('14');
  expect(await num(page, '[data-lh]', 'data-lh')).toBeGreaterThan(20);
  expect(await num(page, '[data-ovulation]', 'data-ovulation')).toBeGreaterThan(13);
  await settle(page, 1500);
  await page.screenshot({ path: `${SHOTS}/09-cycle-surge.png` });
  await day.fill('21');
  await expect(page.locator('[data-uterine]')).toHaveAttribute('data-uterine', 'secretory');
  await slider(page, /Cycle length/).fill('32');
  expect(await num(page, '[data-ovulation]', 'data-ovulation')).toBeGreaterThan(17);
  await radio(page, 'Combined pill').click();
  await expect(page.locator('[data-ovulation]')).toHaveAttribute('data-ovulation', 'none');
  await radio(page, 'PCOS').click();
  await expect(page.locator('[data-ovulation]')).toHaveAttribute('data-ovulation', 'none');
  await page.getByRole('button', { name: 'Inside a follicle' }).click();
  await expect(page.locator('.viewer')).toHaveAttribute('data-close-up', 'follicle');
  expect(errors).toEqual([]);
});

test('Fertilisation: the journey, cleavage to blastocyst, an ectopic pregnancy', async ({ page }) => {
  const errors = await open(page);
  await ready(page);
  await mode(page, 'Fertilisation');
  await expect(page.locator('[data-stage]')).toHaveAttribute('data-stage', 'fertilisation');
  await settle(page, 1500);
  await page.screenshot({ path: `${SHOTS}/10-fertilisation.png` });
  await slider(page, /Days after fertilisation/).fill('5.2');
  await pause(page);
  await expect(page.locator('[data-stage]')).toHaveAttribute('data-stage', 'blastocyst');
  await page.getByLabel(/Ectopic/).check();
  await slider(page, /Days after fertilisation/).fill('7');
  await expect(page.locator('.fert-panel .warn-text')).toContainText('ampulla');
  await page.getByRole('button', { name: 'The embryo' }).click();
  await expect(page.locator('.viewer')).toHaveAttribute('data-close-up', 'embryo');
  expect(errors).toEqual([]);
});

test('Pregnancy: fundal height, fetal weight and the placenta', async ({ page }) => {
  const errors = await open(page);
  await ready(page);
  await mode(page, 'Pregnancy');
  await pause(page);
  const week = slider(page, /Gestational week/);
  await week.fill('20');
  expect(await num(page, '[data-fundus]', 'data-fundus')).toBeCloseTo(20, -1);
  await week.fill('40');
  expect(await num(page, '[data-weight]', 'data-weight')).toBeGreaterThan(3300);
  await week.fill('30');
  await settle(page, 2000);
  await page.screenshot({ path: `${SHOTS}/11-pregnancy.png` });
  await page.getByRole('button', { name: 'Inside the placenta' }).click();
  await expect(page.locator('.viewer')).toHaveAttribute('data-close-up', 'villi');
  expect(errors).toEqual([]);
});

test('Birth: labour stages and contractions, then breastfeeding', async ({ page }) => {
  test.slow();
  const errors = await open(page);
  await ready(page);
  await mode(page, 'Birth & milk');
  await pause(page);
  const time = slider(page, /Time since regular contractions began/);
  await time.fill('9.5');
  await expect(page.locator('[data-stage]')).toHaveAttribute('data-stage', 'first');
  await time.fill('11.6');
  await expect(page.locator('[data-stage]')).toHaveAttribute('data-stage', 'second');
  expect(await num(page, '[data-mvu]', 'data-mvu')).toBeGreaterThan(200);
  await settle(page, 1500);
  await page.screenshot({ path: `${SHOTS}/12-labour.png` });
  await radio(page, 'Breastfeeding').click();
  await pause(page);
  expect(await num(page, '[data-milk]', 'data-milk')).toBeGreaterThan(100);
  await page.getByRole('button', { name: 'Inside an alveolus' }).click();
  await expect(page.locator('.viewer')).toHaveAttribute('data-close-up', 'alveolus');
  expect(errors).toEqual([]);
});

test('Sperm switches to the male body: scenarios, semen analysis, erection, the tubule', async ({ page }) => {
  test.slow();
  const errors = await open(page);
  await ready(page);
  await mode(page, 'Sperm');
  await body(page, 'Male');
  await ready(page);
  await expect(page.locator('.sperm-panel table')).toHaveAttribute('data-diagnosis', /Normozoospermia/);
  await settle(page, 1500);
  await page.screenshot({ path: `${SHOTS}/13-sperm.png` });
  await radio(page, 'Vasectomy').click();
  await expect(page.locator('.sperm-panel table')).toHaveAttribute('data-diagnosis', /Azoospermia/);
  await radio(page, 'Klinefelter (47,XXY)').click();
  expect(await num(page, '.sperm-panel [data-lh]', 'data-lh')).toBeGreaterThan(9);
  await radio(page, 'Healthy').click();
  await slider(page, /Arousal/).fill('0.6');
  await expect(page.locator('[data-arousal-step]')).toHaveAttribute('data-arousal-step', 'fill');
  await slider(page, /Days from a spermatogonium/).fill('40');
  await expect(page.locator('[data-sperm-stage]')).toHaveAttribute('data-sperm-stage', 'Spermatid');
  await page.getByRole('button', { name: 'Inside a seminiferous tubule' }).click();
  await expect(page.locator('.viewer')).toHaveAttribute('data-close-up', 'tubule');
  expect(errors).toEqual([]);
});

test('Contraception: methods act on their body, with perfect and typical failure', async ({ page }) => {
  test.slow(); // loads the second body under software WebGL
  const errors = await open(page);
  await ready(page);
  await mode(page, 'Contraception');
  await expect(page.locator('[data-method]')).toHaveAttribute('data-method', 'combined-pill');
  await expect(page.locator('[data-typical]')).toHaveAttribute('data-typical', '7');
  await page.getByRole('button', { name: 'Implant (etonogestrel)' }).click();
  await expect(page.locator('[data-typical]')).toHaveAttribute('data-typical', '0.05');
  await settle(page, 1500);
  await page.screenshot({ path: `${SHOTS}/14-contraception.png` });
  await page.getByRole('button', { name: 'Vasectomy' }).click();
  await body(page, 'Male');
  await expect(page.locator('[data-method]')).toHaveAttribute('data-method', 'vasectomy');
  await ready(page);
  expect(errors).toEqual([]);
});

test('Disorders: a pattern, the test reader, and a male disorder', async ({ page }) => {
  test.slow(); // loads the second body under software WebGL
  const errors = await open(page);
  await ready(page);
  await mode(page, 'Disorders');
  await page.locator('.disorders-panel').getByRole('button', { name: /^Polycystic ovary syndrome/ }).click();
  await expect(page.locator('[data-disorder]')).toHaveAttribute('data-disorder', 'pcos');
  await radio(page, 'Day-21 progesterone').click();
  await page.getByLabel('Progesterone (nmol/L)').fill('35');
  await expect(page.locator('[data-reading]')).toHaveAttribute('data-reading', 'ok');
  await radio(page, 'PSA').click();
  await page.getByLabel('PSA (ng/mL)').fill('3.5');
  await page.getByLabel('Age (years)').fill('60');
  await expect(page.locator('[data-reading]')).toHaveAttribute('data-reading', 'warn');
  await page.screenshot({ path: `${SHOTS}/15-disorders.png` });
  await page.locator('.disorders-panel').getByRole('button', { name: /^Benign prostatic hyperplasia/ }).click();
  await body(page, 'Male');
  await expect(page.locator('[data-disorder]')).toHaveAttribute('data-disorder', 'bph');
  await ready(page);
  expect(errors).toEqual([]);
});

test('the guided tour crosses both bodies, steps back, and finishes', async ({ page }) => {
  test.slow();
  const errors = await open(page);
  await ready(page);
  await mode(page, 'Guided tour');
  const panel = page.locator('.tour-panel');
  await expect(panel).toContainText('step 1 of 24');
  await page.getByRole('button', { name: 'Next →' }).click();
  await expect(panel).toContainText('step 2 of 24');
  await page.getByRole('button', { name: '← Back' }).click();
  await expect(panel).toContainText('step 1 of 24');
  await panel.getByRole('button', { name: /^Inside the uterus/ }).click();
  await expect(page.locator('.slice-hint')).toContainText('set by the tour');
  await settle(page, 2000);
  await page.screenshot({ path: `${SHOTS}/16-tour-cut.png` });
  await panel.getByRole('button', { name: /^Making sperm/ }).click();
  await body(page, 'Male');
  await expect(page.locator('.tour-panel')).toContainText('step 21 of 24');
  await expect(page.locator('.viewer')).toHaveAttribute('data-close-up', 'tubule');
  await page.getByRole('button', { name: 'Next →' }).click();
  await expect(page.locator('.tour-panel')).toContainText('step 22 of 24');
  await page.locator('.tour-panel').getByRole('button', { name: /^How the pill works/ }).click();
  await body(page, 'Female');
  await expect(page.locator('.tour-panel')).toContainText('step 24 of 24');
  await page.getByRole('button', { name: 'Finish' }).click();
  await expect(page.locator('nav[aria-label="Mode"] button', { hasText: /^Anatomy$/ })).toHaveAttribute('aria-pressed', 'true');
  await ready(page);
  expect(errors).toEqual([]);
});

test('?body=male opens the male body, and the body switch takes a click', async ({ page }) => {
  test.slow();
  const errors = await open(page, '?body=male');
  await ready(page);
  await body(page, 'Male');
  await expect(page.locator('.viewer')).toHaveAttribute('data-body', 'male');
  await page.screenshot({ path: `${SHOTS}/17-male.png` });
  await radio(page, 'Female').click();
  await body(page, 'Female');
  await expect(page.locator('.viewer')).toHaveAttribute('data-body', 'female');
  await ready(page);
  expect(errors).toEqual([]);
});

test('phone layout: structures open from the dock and details follow a pick @smoke', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await ready(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.locator('aside.left')).toBeHidden();
  await page.getByRole('button', { name: 'Structures' }).click();
  await listButton(page, /^Ovary \(left\)$/).click();
  await expect(page.locator('aside.left')).toBeHidden();
  await expect(detailTitle(page)).toHaveText('Ovary (left)');
  await page.screenshot({ path: `${SHOTS}/18-phone.png` });
});

test('the About sheet holds the HuBMAP and BodyParts3D credits', async ({ page }) => {
  await open(page);
  await ready(page);
  await page.getByRole('button', { name: /About this lab/ }).click();
  const dialog = page.getByRole('dialog', { name: 'About this lab' });
  for (const t of ['HuBMAP', 'BodyParts3D', 'Kristen Browne', 'Wilcox', 'Hadlock', 'Zhang', 'Modelled', 'CC BY 4.0']) await expect(dialog).toContainText(t);
  await page.screenshot({ path: `${SHOTS}/19-about.png` });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

test('without WebGL the learning content still works @smoke', async ({ page }) => {
  await open(page, '?nowebgl');
  await expect(page.getByRole('heading', { name: '3D view unavailable' })).toBeVisible();
  await listButton(page, /^Ovary \(left\)$/).click();
  await expect(detailTitle(page)).toHaveText('Ovary (left)');
  await mode(page, 'Cycle');
  await expect(page.locator('[data-ovulation]')).toHaveAttribute('data-ovulation', /^1[3-5]\./);
  await mode(page, 'Contraception');
  await expect(page.locator('[data-method]')).toHaveAttribute('data-method', 'combined-pill');
});

test('a missing model shows an error with a working retry', async ({ page }) => {
  let fail = true;
  await page.route('**/models/female.glb', (route) => (fail ? route.fulfill({ status: 404, body: 'not found' }) : route.continue()));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('The 3D model could not be loaded');
  fail = false;
  await page.getByRole('button', { name: 'Try again' }).click();
  await ready(page);
});

test('reduced motion: the animated views and close-ups work without errors', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1366, height: 820 } });
  const page = await context.newPage();
  const errors = await open(page);
  await ready(page);
  for (const m of ['Cycle', 'Fertilisation', 'Pregnancy', 'Birth & milk', 'Sperm']) { await mode(page, m); await settle(page, 800); }
  await page.getByRole('button', { name: 'Inside a seminiferous tubule' }).click();
  await settle(page, 800);
  expect(errors).toEqual([]);
  await context.close();
});
