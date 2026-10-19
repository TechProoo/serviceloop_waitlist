import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("renders desktop with working images and no page errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Let’s get to work.",
  );
  await expect(page.locator(".equipment-grid .equipment-card")).toHaveCount(4);
  await page.locator("#equipment").scrollIntoViewIfNeeded();
  await page.waitForFunction(() =>
    [
      ...document.querySelectorAll<HTMLImageElement>(
        ".hero-photo, .equipment-image img",
      ),
    ].every((image) => image.complete && image.naturalWidth > 0),
  );
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("combines equipment search, location and filters, with an empty state", async ({
  page,
}) => {
  await page
    .getByRole("textbox", { name: "Search equipment" })
    .fill("generator");
  await page
    .getByLabel("Project location", { exact: true })
    .selectOption("Lagos");
  await page
    .getByRole("button", { name: "Find equipment", exact: true })
    .click();
  await expect(page.locator(".equipment-grid .equipment-card")).toHaveCount(1);
  await expect(page.locator(".equipment-grid")).toContainText(
    "100 kVA Diesel Generator",
  );
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Operator included", exact: true })
    .check();
  await expect(
    page.getByRole("heading", { name: "No equipment matches just yet." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await expect(page.locator(".equipment-grid .equipment-card")).toHaveCount(8);
});

test("saves equipment across reloads and removes it from the saved dialog", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Save CAT 320 Excavator", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: "Saved equipment, 1 items" }).click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "CAT 320 Excavator", exact: true }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Unsave CAT 320 Excavator", exact: true })
    .click();
  await expect(
    dialog.getByRole("heading", { name: "Keep the good finds close." }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});

test("calculates rental totals and persists a quote request", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "View CAT 320 Excavator", exact: true })
    .click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Rental duration").selectOption("7");
  await expect(dialog.locator(".cost-total")).toContainText("₦1,260,000");
  await dialog.getByRole("button", { name: "Request this equipment" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Your name").fill("Test Builder");
  await dialog.getByLabel("Email address").fill("builder@example.com");
  await dialog.getByLabel("Project location").fill("Lekki, Lagos");
  await dialog
    .getByLabel("Anything we should know?")
    .fill("Delivery required; site access is available.");
  await expect(dialog.getByLabel("Number of days")).toHaveValue("7");
  await dialog.getByRole("button", { name: "Save quote request" }).click();
  await expect(
    dialog.getByRole("heading", { name: "Request saved." }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "View my requests" }).click();
  await expect(dialog.locator(".request-card")).toContainText(
    "CAT 320 Excavator",
  );
  await page.reload();
  await page
    .getByRole("button", { name: "My requests", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog").locator(".request-card")).toContainText(
    "₦1,260,000",
  );
});

test("creates a sample listing that can be found after reload", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "List equipment", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Equipment name").fill("Test Forklift");
  await dialog
    .getByLabel("Category", { exact: true })
    .selectOption("Lifting equipment");
  await dialog.getByLabel("Capacity / specification").fill("3 tonnes");
  await dialog.getByRole("spinbutton", { name: "Daily rate (₦)", exact: true }).fill("50000");
  await dialog.getByLabel("Area / neighbourhood").fill("Ikeja");
  await dialog.getByLabel("Business name").fill("Test Rentals");
  await dialog
    .getByLabel("Description")
    .fill("An example forklift for the interaction test.");
  await dialog.getByRole("button", { name: "Create sample listing" }).click();
  await expect(
    dialog.getByRole("heading", { name: "Your sample listing is ready." }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("textbox", { name: "Search equipment" })
    .fill("Test Forklift");
  await page
    .getByRole("button", { name: "Find equipment", exact: true })
    .click();
  await expect(page.locator(".equipment-grid .equipment-card")).toHaveCount(1);
  await expect(page.locator(".equipment-grid")).toContainText("₦50,000");
});

test("mobile layout fits and navigation and service requests work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Find services" })
    .click();
  await page
    .getByRole("button", { name: /Equipment operators Experienced/ })
    .click();
  await expect(
    page.getByRole("dialog").getByLabel("What do you need?"),
  ).toHaveValue("Equipment operators");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close dialog" })
    .click();
  await page.setViewportSize({ width: 320, height: 720 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
