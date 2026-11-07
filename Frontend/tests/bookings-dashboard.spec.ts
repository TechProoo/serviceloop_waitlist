import { test, expect } from '@playwright/test';
import type { Booking } from '../src/state/marketplaceContext';

const password = 'browser-test-password';
const listApi = '**/api/bookings?*';
const date = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

async function fixtures(id: string): Promise<Booking[]> {
  const states: Booking['reservationState'][] = ['HELD', 'HELD', 'EXPIRED', 'NONE', 'NOT_APPLICABLE', 'CANCELLED', 'CANCELLED', 'EXPIRED', 'NONE', 'CANCELLED'];
  const titles = ['CAT 320 Excavator', '100 kVA Site Generator', 'Concrete Mixer', 'Mobile Crane', 'Site preparation', 'Flatbed Truck', 'Scaffolding', 'Compactor', 'Backhoe Loader', 'Water Pump'];
  return states.map((state, index) => ({
    id: `dashboard-${index}`, reference: `SL-${String(index + 1).padStart(12, '0')}`, requestId: `request-${index}`,
    renterId: index % 2 === 0 ? id : 'another-renter', ownerId: index === 4 ? null : index % 2 === 0 ? 'another-owner' : id,
    equipmentId: index === 4 ? null : index + 1, title: titles[index], service: index === 4 ? 'Site preparation' : 'Equipment rental',
    equipmentCategory: index === 1 ? 'Power & generators' : 'Heavy machinery', capacity: '20 tonnes', image: '',
    equipmentLocation: 'Lagos', operator: true, vendor: 'Atlas Equipment', ownerName: 'Equipment Owner', ownerEmail: 'owner@example.test',
    renterName: index % 2 === 0 ? 'Ada Builder' : 'Project Renter', renterEmail: 'renter@example.test', location: index === 0 ? 'Ikeja, Lagos' : 'Lekki, Lagos',
    start: date(index === 7 ? -3 : index + 2), end: date(index === 7 ? -1 : index + 4), days: 3, agreedAmount: 600000, currency: 'NGN', terms: 'Delivery included', notes: '',
    status: state === 'CANCELLED' ? 'CANCELLED' : 'AWAITING_CONFIRMATION', acceptedAt: new Date(Date.now() - index * 60000).toISOString(), imported: state === 'NONE',
    reservedAt: ['HELD', 'EXPIRED', 'CANCELLED'].includes(state) ? new Date(Date.now() - 3600000).toISOString() : null,
    reservationExpiresAt: state === 'HELD' ? new Date(Date.now() + (index + 1) * 1800000).toISOString() : ['EXPIRED', 'CANCELLED'].includes(state) ? new Date(Date.now() - 10000).toISOString() : null,
    cancelledAt: state === 'CANCELLED' ? new Date().toISOString() : null, reservationState: state, serverTime: new Date().toISOString(), holdHours: 2,
  }));
}

test('booking dashboard filters, perspectives, pagination and responsive planning views', async ({ page }, testInfo) => {
  test.setTimeout(90000);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/bookings'); await expect(page).toHaveURL(/\/login\?next=%2Fbookings/);
  const account = await page.request.post('/api/auth/register', { data: { name: 'Ada Builder', email: `dashboard-${Date.now()}@browser.test`, password, role: 'OWNER' } });
  expect(account.status()).toBe(201);
  const records = await fixtures((await account.json()).user.id);
  // Exercise display-only historical/service states without mutating a live database.
  await page.route(listApi, route => route.fulfill({ json: { items: records, total: records.length } }));
  await page.goto('/requests?tab=bookings'); await expect(page).toHaveURL(/\/bookings$/);
  await expect(page).toHaveTitle('Booking dashboard — Service Loop');
  await expect(page.locator('.dashboard-booking')).toHaveCount(8);
  const metric = (name: string) => page.locator('.dashboard-metric').filter({ hasText: name }).locator(':scope > strong');
  await expect(metric('Total bookings')).toHaveText('10');
  await expect(metric('Live date holds')).toHaveText('2');
  await expect(metric('Needs attention')).toHaveText('5');
  await expect(metric('Agreed quote total')).toContainText('4,200,000');
  await expect(page.locator('.dashboard-upcoming li')).toHaveCount(3);
  await expect(page.locator('.dashboard-upcoming')).not.toContainText('Flatbed Truck');
  await expect(page.locator('.dashboard-upcoming')).not.toContainText('Compactor');
  await expect(page.locator('.dashboard-upcoming')).toContainText('Rental confirmation is still pending.');
  await page.screenshot({ path: testInfo.outputPath('dashboard-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('.dashboard-booking')).toHaveCount(2);
  await expect(page.getByRole('navigation', { name: 'Booking pages' })).toContainText('Page 2 of 2');
  await page.reload(); await expect(page.locator('.dashboard-booking')).toHaveCount(2);
  await page.getByRole('button', { name: /Dates reserved/ }).click();
  await expect(page.locator('.dashboard-booking')).toHaveCount(2);
  await expect(page.locator('.dashboard-booking .dashboard-status')).toHaveText(['Dates reserved', 'Dates reserved']);
  await expect(page.getByRole('navigation', { name: 'Booking pages' })).toHaveCount(0);
  await page.getByRole('button', { name: /Needs attention/ }).click();
  await expect(page.locator('.dashboard-booking')).toHaveCount(5);
  await expect(page.getByRole('link', { name: 'Review rental dates', exact: true })).toHaveCount(0); // Past rental belongs to another renter.
  await page.getByLabel('Search bookings', { exact: true }).fill('SL-000000000003');
  await expect(page.locator('.dashboard-booking')).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Review & reserve', exact: true })).toHaveAttribute('href', '/bookings/dashboard-2');
  await page.getByLabel('Search bookings', { exact: true }).fill('not-a-project');
  await expect(page.getByRole('heading', { name: 'No bookings match this view.' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.locator('.dashboard-booking')).toHaveCount(8);
  await page.getByLabel('Search bookings', { exact: true }).fill('  IKEJA  ');
  await expect(page.locator('.dashboard-booking')).toHaveCount(1);
  await page.getByLabel('Search bookings', { exact: true }).fill('');
  await page.getByLabel('Sort bookings', { exact: true }).selectOption('start');
  await expect(page.locator('.dashboard-booking').first()).toContainText('Compactor');
  await page.getByRole('button', { name: 'I’m providing', exact: true }).click();
  await expect(page.locator('.dashboard-booking')).toHaveCount(5);
  await expect(metric('Total bookings')).toHaveText('5');
  await expect(page.locator('.dashboard-booking')).not.toContainText(['CAT 320 Excavator']);
  await page.getByRole('button', { name: 'I’m renting', exact: true }).click();
  await expect(page.locator('.dashboard-booking')).toHaveCount(5);
  await expect(page.locator('.dashboard-booking').first()).toContainText('CAT 320 Excavator');
  await page.getByRole('button', { name: /Cancelled/ }).click();
  await expect(page.locator('.dashboard-booking')).toHaveCount(1);
  await expect(page.locator('.dashboard-booking .dashboard-status')).toHaveText('Cancelled');
  await page.getByRole('button', { name: 'All my bookings', exact: true }).click();
  await expect(metric('Total bookings')).toHaveText('10');
  await page.getByRole('button', { name: /All bookings/ }).click();
  await expect(page.locator('.dashboard-booking')).toHaveCount(8);
  await page.getByLabel('Sort bookings', { exact: true }).selectOption('recent');
  await expect(page.locator('.dashboard-booking').first()).toContainText('CAT 320 Excavator');
  for (const width of [1100, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    const overflowing = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(element => element.getBoundingClientRect().right > window.innerWidth + 1).map(element => `${element.tagName}.${element.className}`).slice(0, 12));
    expect(overflowing, `No overflow at ${width}px`).toEqual([]);
    if (width === 390) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({ path: testInfo.outputPath('dashboard-mobile.png'), fullPage: true });
    }
  }
  await page.getByRole('button', { name: /Needs attention/ }).click();
  await expect(page.locator('.dashboard-booking')).toHaveCount(5);
  expect(errors).toEqual([]);
});

test('dashboard expires live holds, refreshes changed bookings, and recovers from API failures', async ({ page }) => {
  const account = await page.request.post('/api/auth/register', { data: { name: 'Dashboard Renter', email: `clock-${Date.now()}@browser.test`, password, role: 'CUSTOMER' } });
  expect(account.status()).toBe(201);
  const [base] = await fixtures((await account.json()).user.id);
  let records = [{ ...base, serverTime: new Date().toISOString(), reservationExpiresAt: new Date(Date.now() + 4000).toISOString() }];
  await page.route(listApi, route => route.fulfill({ json: { items: records, total: records.length } }));
  await page.goto('/bookings?status=held');
  await expect(page.locator('.dashboard-booking')).toHaveCount(1);
  await expect(page.getByLabel('Booking perspective')).toHaveCount(0);
  await expect(page.locator('.dashboard-booking')).toHaveCount(0, { timeout: 12000 });
  await expect(page.locator('.dashboard-metric-held > strong')).toHaveText('0');
  await expect(page.locator('.dashboard-priority')).toHaveCount(0);
  await page.getByRole('button', { name: /Needs attention/ }).click();
  await expect(page.locator('.dashboard-booking .dashboard-status')).toHaveText('Reservation expired');
  records = [{ ...base, status: 'CANCELLED', reservationState: 'CANCELLED', cancelledAt: new Date().toISOString() }];
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.getByRole('button', { name: /Cancelled/ }).click();
  await expect(page.locator('.dashboard-booking .dashboard-status')).toHaveText('Cancelled');
  await page.unroute(listApi); await page.route(listApi, route => route.abort());
  await page.getByRole('button', { name: 'Refresh bookings', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('We couldn’t load your bookings.');
  await expect(page.locator('.dashboard-booking')).toHaveCount(0);
  await page.unroute(listApi); // The actual API has no bookings for this fresh account.
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await page.getByRole('button', { name: /All bookings/ }).click();
  await expect(page.getByRole('heading', { name: 'Your next chapter starts with a quote.' })).toBeVisible();
  await expect(page.locator('.dashboard-metric-held > strong')).toHaveText('0');
  await expect(page.locator('.dashboard-upcoming li')).toHaveCount(0);
});
