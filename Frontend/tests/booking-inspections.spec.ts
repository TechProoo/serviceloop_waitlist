import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const password = 'browser-test-password';

async function locked(page: Page, stage: 'handover' | 'return') {
  await expect(page.getByText('Locked until payment', { exact: true })).toBeVisible();
  await expect(page.locator('#inspection-lock-description')).toContainText('Payments are not available yet.');
  await expect(page.locator('.inspection-workspace input:enabled, .inspection-workspace select:enabled, .inspection-workspace textarea:enabled')).toHaveCount(0);
  await expect(page.getByLabel('Inspection photos', { exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: stage === 'handover' ? 'Record handover' : 'Submit return inspection', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: stage === 'handover' ? 'Confirm equipment received' : 'Confirm return received', exact: true })).toBeDisabled();
  await expect(page.locator('.inspection-checklist input:checked')).toHaveCount(0);
  await expect(page.locator('.inspection-condition-options input:checked')).toHaveCount(0);
  await expect(page.getByText('This checklist is a preview. Nothing has been recorded.', { exact: true })).toBeVisible();
}

test('renter and owner can review handover and return screens without recording or changing the booking', async ({ page }, testInfo) => {
  test.setTimeout(90000);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const email = `inspection-${Date.now()}@browser.test`;
  const account = await page.request.post('/api/auth/register', { data: { name: 'Inspection Renter', email, password, role: 'CUSTOMER' } });
  expect(account.status()).toBe(201); const renterToken = (await account.json()).accessToken;
  const owner = await page.request.post('/api/auth/login', { data: { email: 'owner@browser.test', password } });
  expect(owner.status()).toBe(200); const ownerToken = (await owner.json()).accessToken;
  const headers = (token: string) => ({ Authorization: `Bearer ${token}` });
  const start = new Date(Date.now() + 80 * 86400000).toISOString().slice(0, 10);
  const request = await page.request.post('/api/requests', { headers: headers(renterToken), data: { equipmentId: 1, start, days: 3, location: 'Ikeja, Lagos' } });
  expect(request.status()).toBe(201); const requestId = (await request.json()).id;
  expect((await page.request.patch(`/api/requests/${requestId}`, { headers: headers(ownerToken), data: { status: 'QUOTED', quotedAmount: 600000, quoteNotes: 'Delivery and operator included' } })).status()).toBe(200);
  const accepted = await page.request.patch(`/api/requests/${requestId}`, { headers: headers(renterToken), data: { status: 'ACCEPTED' } });
  expect(accepted.status()).toBe(200); const id = (await accepted.json()).booking.id;
  const before = await (await page.request.get(`/api/bookings/${id}`, { headers: headers(renterToken) })).json();
  expect((await page.request.post('/api/auth/login', { data: { email, password } })).status()).toBe(200);

  const bookingWrites: string[] = [];
  page.on('request', request => { if (/\/api\/bookings(?:\/|\?)/.test(request.url()) && request.method() !== 'GET') bookingWrites.push(request.method() + ' ' + request.url()); });
  await page.goto('/bookings');
  await page.getByRole('link', { name: 'Handover checklist for CAT 320 Excavator', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/bookings/${id}/handover$`));
  await expect(page).toHaveTitle('Equipment handover — Service Loop');
  await expect(page.locator('.inspection-equipment')).toContainText(before.reference);
  await expect(page.getByRole('heading', { name: 'Handover inspection', exact: true })).toBeVisible();
  await locked(page, 'handover');
  await page.screenshot({ path: testInfo.outputPath('handover-desktop.png'), fullPage: true });
  await page.getByRole('navigation', { name: 'Handover and return views' }).getByRole('link', { name: /Equipment return/ }).click();
  await expect(page).toHaveURL(new RegExp(`/bookings/${id}/return$`));
  await expect(page).toHaveTitle('Equipment return — Service Loop');
  await locked(page, 'return');
  await expect(page.locator('.inspection-comparison')).toContainText('No handover inspection has been recorded');
  await expect(page.locator('.inspection-comparison dd')).toHaveText(['Not recorded', 'Not recorded', 'Not recorded']);
  await page.screenshot({ path: testInfo.outputPath('return-desktop.png'), fullPage: true });
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Return fits ${width}px`).toBe(true);
    if (width === 390) {
      const noticeWidth = await page.locator('#inspection-lock-description').evaluate(element => element.getBoundingClientRect().width);
      expect(noticeWidth).toBeGreaterThan(220);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({ path: testInfo.outputPath('return-mobile.png'), fullPage: true });
    }
  }
  await page.getByRole('link', { name: 'Back to booking', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Handover & returns', exact: true })).toBeVisible();
  await page.locator('.operations-links').getByRole('link', { name: /Equipment handover/ }).click();
  await locked(page, 'handover');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.reload(); await locked(page, 'handover');
  const after = await (await page.request.get(`/api/bookings/${id}`, { headers: headers(renterToken) })).json();
  expect(after).toEqual({ ...before, serverTime: expect.any(String) });
  expect(bookingWrites).toEqual([]);

  // The equipment owner sees the same lock; account role cannot bypass it.
  await page.request.post('/api/auth/logout');
  expect((await page.request.post('/api/auth/login', { data: { email: 'owner@browser.test', password } })).status()).toBe(200);
  await page.goto(`/bookings/${id}/handover`); await locked(page, 'handover');
  await expect(page.locator('.inspection-equipment')).toContainText('For Inspection Renter');
  await page.goto(`/bookings/${id}/return`); await locked(page, 'return');
  expect(bookingWrites).toEqual([]);

  // Cancelled bookings remain inspectable, with a specific reason for the lock.
  expect((await page.request.post(`/api/bookings/${id}/cancel`, { headers: headers(ownerToken) })).status()).toBe(201);
  await page.reload(); await expect(page.locator('#inspection-lock-title')).toHaveText('This booking is cancelled.');
  await expect(page.getByRole('button', { name: 'Submit return inspection', exact: true })).toBeDisabled();
  await page.request.post('/api/auth/logout');
  expect((await page.request.post('/api/auth/register', { data: { name: 'Unrelated Renter', email: `unrelated-${Date.now()}@browser.test`, password, role: 'CUSTOMER' } })).status()).toBe(201);
  for (const stage of ['handover', 'return']) {
    await page.goto(`/bookings/${id}/${stage}`);
    await expect(page.getByRole('heading', { name: 'Booking not found.' })).toBeVisible();
    await expect(page.locator('.inspection-equipment')).toHaveCount(0);
    await expect(page.locator('.inspection-workspace')).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test('inspection direct links require access and handle unavailable or service bookings', async ({ page }) => {
  const id = 'inspection-readonly';
  await page.goto(`/bookings/${id}/return`); await expect(page).toHaveURL(/\/login\?next=/);
  const account = await page.request.post('/api/auth/register', { data: { name: 'Other Renter', email: `inspection-access-${Date.now()}@browser.test`, password, role: 'CUSTOMER' } });
  expect(account.status()).toBe(201);
  await page.goto(`/bookings/${id}/return`);
  await expect(page.getByRole('heading', { name: 'Booking not found.' })).toBeVisible();
  await expect(page.locator('.inspection-workspace')).toHaveCount(0);
  await page.route(`**/api/bookings/${id}`, route => route.abort()); await page.reload();
  await expect(page.getByRole('alert')).toContainText('We couldn’t load this checklist.');
  await page.unroute(`**/api/bookings/${id}`);
  await page.route(`**/api/bookings/${id}`, route => route.fulfill({ json: { id, equipmentId: null, reference: 'SL-SERVICE', status: 'AWAITING_CONFIRMATION' } }));
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'This is a service booking.' })).toBeVisible();
  await expect(page.locator('.inspection-workspace')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Back to booking', exact: true })).toHaveAttribute('href', `/bookings/${id}`);
  await page.goto(`/bookings/${id}/handover`);
  await expect(page.getByRole('heading', { name: 'This is a service booking.' })).toBeVisible();
  await expect(page.locator('.inspection-form-card')).toHaveCount(0);
});
