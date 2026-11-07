import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
const password = 'browser-test-password';
async function signIn(page: Page, email: string) {
  await page.goto('/login'); await page.getByLabel('Email address').fill(email); await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click(); await expect(page).toHaveURL(/\/requests$/);
}
async function signOut(page: Page) { await page.goto('/account'); await page.getByRole('button', { name: 'Sign out', exact: true }).click(); await expect(page).toHaveURL(/\/$/); }

test('persists quote acceptance and private booking details through the real API and cookie sessions', async ({ page }, testInfo) => {
  test.setTimeout(90000);
  const email = `builder-${Date.now()}@browser.test`;
  await page.goto('/saved'); await expect(page).toHaveURL(/\/login/);
  await page.getByRole('button', { name: 'New here? Create an account' }).click();
  await page.getByLabel('Your name').fill('Project Builder'); await page.getByLabel('Email address').fill(email); await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Create account', exact: true }).click(); await expect(page).toHaveURL(/\/saved$/);
  await page.goto('/equipment'); await page.getByRole('button', { name: 'Save CAT 320 Excavator', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Unsave CAT 320 Excavator', exact: true })).toBeVisible();
  await page.reload(); await expect(page.getByRole('button', { name: 'Unsave CAT 320 Excavator', exact: true })).toBeVisible();
  await page.goto('/equipment/1'); await page.getByRole('link', { name: 'Request this equipment' }).click();
  await page.getByLabel('Project location', { exact: true }).fill('Ikeja, Lagos');
  await page.getByLabel('Number of days').fill('3'); await page.getByRole('button', { name: 'Submit quote request' }).click();
  await expect(page.getByText('Your request has been submitted.', { exact: false }).first()).toBeVisible();
  await page.getByRole('link', { name: 'View my requests' }).click(); await expect(page.locator('.project-request')).toHaveCount(1);
  await expect(page.locator('.project-request')).toContainText('540,000');
  await page.reload(); await expect(page.locator('.draft-badge')).toHaveText('submitted');
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('sl-')))).toEqual([]);
  await signOut(page); await signIn(page, 'owner@browser.test');
  await page.getByLabel('Complete amount (₦)').fill('600000'); await page.getByLabel('What is included?').fill('Delivery included');
  await page.getByRole('button', { name: 'Send quote', exact: true }).click(); await expect(page.locator('.project-request').filter({ hasText: email }).locator('.draft-badge')).toHaveText('quoted');
  await signOut(page); await signIn(page, email); await page.getByRole('button', { name: 'Accept quote' }).click();
  await expect(page).toHaveURL(/\/bookings\//);
  const bookingUrl = page.url();
  await expect(page.getByRole('heading', { name: 'Your rental, in detail.' })).toBeVisible();
  await expect(page.locator('.booking-total')).toContainText('600,000');
  await expect(page.locator('.booking-terms')).toHaveText('Delivery included');
  await expect(page.locator('.reservation-panel')).toContainText('Your dates are held for you.');
  await expect(page.locator('.reservation-countdown')).toContainText('WAT');
  await expect(page.locator('.booking-details-grid')).toContainText('3 days');
  const reference = await page.locator('.booking-reference-box strong').innerText();
  expect(reference).toMatch(/^SL-[A-F0-9]{12}$/);
  await page.reload(); await expect(page.locator('.booking-reference-box strong')).toHaveText(reference);
  await page.screenshot({ path: testInfo.outputPath('booking-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { name: 'Rental terms & inclusions' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('booking-mobile.png'), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  const bookingApi = `**/api/bookings/${bookingUrl.split('/').at(-1)}`;
  await page.route(bookingApi, route => route.abort()); await page.reload();
  await expect(page.getByRole('alert')).toContainText('We couldn’t load this booking.');
  await page.unroute(bookingApi); await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.locator('.booking-reference-box strong')).toHaveText(reference);
  await page.getByRole('link', { name: 'Back to your bookings' }).click();
  await expect(page).toHaveURL(/\/bookings$/);
  await expect(page.getByRole('heading', { name: 'Booking dashboard.' })).toBeVisible();
  await expect(page.locator('.dashboard-booking')).toHaveCount(1);
  await expect(page.locator('.dashboard-booking')).toContainText(reference);
  await expect(page.locator('.dashboard-booking .dashboard-status')).toHaveText('Dates reserved');
  await page.getByRole('link', { name: 'Quote requests (1)' }).click();
  await expect(page.locator('.draft-badge')).toHaveText('accepted');
  await page.getByRole('link', { name: 'View booking details' }).click(); await expect(page).toHaveURL(bookingUrl);
  await signOut(page); await signIn(page, 'owner@browser.test');
  await page.getByRole('navigation', { name: 'Workspace views' }).getByRole('link', { name: /^Bookings/ }).click();
  await page.getByRole('button', { name: 'I’m providing', exact: true }).click();
  await expect(page.getByRole('button', { name: 'I’m providing', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('Search bookings', { exact: true }).fill(reference);
  await expect(page.locator('.dashboard-booking')).toHaveCount(1);
  await expect(page.locator('.dashboard-booking')).toContainText('Rented by Project Builder');
  await page.getByRole('link', { name: 'View booking', exact: true }).click();
  await expect(page.locator('.booking-reference-box strong')).toHaveText(reference);
  await expect(page.locator('.booking-contact-grid')).toContainText(email);
  await page.getByRole('button', { name: 'Cancel booking', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm cancellation', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'This booking has been cancelled.' })).toBeVisible();
  await page.goto('/equipment/1');
  await expect(page.getByText('These dates are available to request', { exact: true })).toBeVisible();
  await signOut(page); await page.goto(bookingUrl); await expect(page).toHaveURL(/\/login\?next=/);
  await page.getByRole('button', { name: 'New here? Create an account' }).click();
  await page.getByLabel('Your name').fill('Another Renter'); await page.getByLabel('Email address').fill(`other-${Date.now()}@browser.test`); await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Booking not found.' })).toBeVisible();
  await expect(page.locator('.booking-total')).toHaveCount(0);
  await page.getByRole('link', { name: 'Back to bookings' }).click();
  await expect(page.getByRole('heading', { name: 'Your next chapter starts with a quote.' })).toBeVisible();
});

test('handles competing date reservations and updates an expired countdown', async ({ page }) => {
  test.setTimeout(90000);
  const stamp = Date.now(), firstEmail = `first-${stamp}@dates.test`, secondEmail = `second-${stamp}@dates.test`;
  const start = new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10);
  async function account(email: string) {
    const response = await page.request.post('/api/auth/register', { data: { name: 'Date test renter', email, password, role: 'CUSTOMER' } });
    expect(response.status()).toBe(201); return (await response.json()).accessToken as string;
  }
  const firstToken = await account(firstEmail), secondToken = await account(secondEmail);
  const ownerLogin = await page.request.post('/api/auth/login', { data: { email: 'owner@browser.test', password } });
  expect(ownerLogin.status()).toBe(200); const ownerToken = (await ownerLogin.json()).accessToken;
  const headers = (token: string) => ({ Authorization: `Bearer ${token}` });
  async function quoted(token: string) {
    const response = await page.request.post('/api/requests', { headers: headers(token), data: { equipmentId: 1, start, days: 3, location: 'Lagos' } });
    expect(response.status()).toBe(201); const id = (await response.json()).id;
    expect((await page.request.patch(`/api/requests/${id}`, { headers: headers(ownerToken), data: { status: 'QUOTED', quotedAmount: 600000, quoteNotes: 'Delivery included' } })).status()).toBe(200);
    return id as string;
  }
  await quoted(firstToken); const secondRequest = await quoted(secondToken);
  const winner = await page.request.patch(`/api/requests/${secondRequest}`, { headers: headers(secondToken), data: { status: 'ACCEPTED' } });
  expect(winner.status()).toBe(200); const winnerBooking = (await winner.json()).booking.id;
  // Clear the setup account's cookie before exercising the renter's browser flow.
  await page.context().clearCookies(); await signIn(page, firstEmail);
  await page.getByRole('button', { name: 'Accept quote', exact: true }).click();
  await expect(page.locator('.project-request .form-error')).toContainText('reserved for some of these dates');
  await expect(page).toHaveURL(/\/requests$/); await expect(page.locator('.draft-badge')).toHaveText('quoted');
  await page.goto(`/equipment/1?date=${start}`); await page.getByLabel('Rental duration').selectOption('3');
  await expect(page.getByText('These dates are temporarily reserved', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Request this equipment' })).toHaveCount(0);
  expect((await page.request.post(`/api/bookings/${winnerBooking}/cancel`, { headers: headers(secondToken) })).status()).toBe(201);
  await page.getByRole('button', { name: 'Check again', exact: true }).click();
  await expect(page.getByText('These dates are available to request', { exact: true })).toBeVisible();
  await page.goto('/requests'); await page.getByRole('button', { name: 'Accept quote', exact: true }).click();
  await expect(page).toHaveURL(/\/bookings\//); await expect(page.getByRole('heading', { name: 'Your dates are held for you.' })).toBeVisible();
  const bookingApi = `/api/bookings/${page.url().split('/').at(-1)}`;
  const saved = await (await page.request.get(bookingApi, { headers: headers(firstToken) })).json();
  // Test the UI deadline without waiting two hours. Actual server-side expiry
  // and re-reservation are verified against PostgreSQL in reservations.spec.ts.
  await page.route(`**${bookingApi}`, route => route.fulfill({ json: { ...saved, serverTime: new Date().toISOString(), reservedAt: new Date(Date.now() - 7199000).toISOString(), reservationExpiresAt: new Date(Date.now() + 1000).toISOString() } }));
  await page.reload(); await expect(page.getByRole('heading', { name: 'Your date reservation has expired.' })).toBeVisible();
  await page.unroute(`**${bookingApi}`);
  await page.getByRole('button', { name: 'Reserve dates again', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your dates are held for you.' })).toBeVisible();
  const restored = await (await page.request.get(bookingApi, { headers: headers(firstToken) })).json();
  expect(restored.reservationExpiresAt).toBe(saved.reservationExpiresAt);
  let received = 0;
  await page.route('**/api/bookings?*', route => {
    received = Date.now();
    return route.fulfill({ json: { items: [{ ...restored, serverTime: new Date(received).toISOString(), reservationExpiresAt: new Date(received + 1000).toISOString() }], total: 1 } });
  });
  await page.reload(); await expect(page.getByRole('heading', { name: 'Your dates are held for you.' })).toBeVisible();
  await expect.poll(() => received > 0 && Date.now() - received > 1500).toBe(true);
  await page.getByRole('link', { name: 'Back to your bookings' }).click();
  await expect(page.locator('.dashboard-booking')).toHaveCount(1);
  await expect(page.locator('.dashboard-booking .dashboard-status')).toHaveText('Reservation expired');
});

test('submits owner inventory for review and keeps pending listings out of the catalog', async ({ page }) => {
  await signIn(page, 'owner@browser.test'); await page.goto('/list-equipment');
  await page.getByLabel('Equipment name', { exact: true }).fill('Browser Test Generator');
  await page.getByLabel('Capacity / specification').fill('100 kVA');
  await page.getByLabel('Tell us about the equipment').fill('A reliable generator for site work');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Daily rate (₦)').fill('45000'); await page.getByLabel('Area / neighbourhood').fill('Ajah'); await page.getByLabel('Business name').fill('Power Rentals');
  await page.getByRole('button', { name: 'Continue', exact: true }).click(); await page.getByRole('button', { name: 'Submit listing', exact: true }).click();
  await expect(page.getByText('Your listing has been submitted for review.', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: 'My equipment', exact: true }).click(); await expect(page.locator('.my-equipment-list')).toContainText('Browser Test Generator');
  await page.reload(); await expect(page.locator('.my-equipment-list')).toContainText('pending');
  await page.goto('/equipment'); await expect(page.locator('.catalog-grid')).not.toContainText('Browser Test Generator');
});

test('shows API failures without falling back to sample inventory', async ({ page }) => {
  await page.route('**/api/equipment?**', route => route.abort()); await page.goto('/equipment');
  await expect(page.getByRole('alert')).toContainText('Cannot reach ServiceLoop'); await expect(page.locator('.equipment-card')).toHaveCount(0);
  await page.unroute('**/api/equipment?**'); await page.getByRole('button', { name: 'Try again' }).click(); await expect(page.locator('.equipment-card')).toHaveCount(1);
});

test('shows an empty catalog when the API has no equipment', async ({ page }) => {
  await page.route('**/api/equipment?**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0, limit: 100, offset: 0 }) }));
  await page.goto('/equipment');
  await expect(page.getByRole('heading', { name: 'No equipment matches just yet.' })).toBeVisible();
  await expect(page.locator('.equipment-card')).toHaveCount(0);
  await expect(page.getByText('CAT 320 Excavator', { exact: true })).toHaveCount(0);
  await page.goto('/');
  await expect(page.locator('#equipment .empty-state')).toBeVisible();
  await expect(page.locator('.equipment-card')).toHaveCount(0);
});

for (const port of [5183, 5184]) test(`waitlist ${port} reports success only after an API acknowledgement`, async ({ page }) => {
  await page.goto(`http://127.0.0.1:${port}`);
  await expect(page.locator('.form-area input')).toHaveCount(2);
  await expect(page.locator('.form-area select')).toHaveCount(0);
  await page.locator('#name').fill('Waitlist Builder'); await page.locator('#phone').fill('08012345678');
  await page.route('**/api/waitlist', route => route.abort()); await page.getByRole('button', { name: 'Join the waitlist', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Cannot reach ServiceLoop'); await expect(page.locator('.success-number')).toHaveCount(0);
  await page.unroute('**/api/waitlist'); await page.getByRole('button', { name: 'Join the waitlist', exact: true }).click(); await expect(page.locator('.success-number')).toContainText('Your interest has been recorded.');
});
