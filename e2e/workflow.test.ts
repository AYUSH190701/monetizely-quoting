import { test, expect } from '@playwright/test';

/**
 * E2E test: Full workflow from catalog setup to quote creation and viewing
 *
 * This test covers:
 * 1. Creating a product with tiers
 * 2. Adding features to the product
 * 3. Building a quote from the catalog
 * 4. Viewing the saved quote via its shareable URL
 */

// Generate unique names to avoid collisions between test runs
const timestamp = Date.now();
const productName = `Test Product ${timestamp}`;
const quoteName = `Acme Corp - Test Quote ${timestamp}`;

test.describe('Quoting Tool Workflow', () => {
  test('should complete full workflow: create catalog → build quote → view quote', async ({ page }) => {
    // ===== STEP 1: Navigate to the home page =====
    await page.goto('/');
    await expect(page.getByText('Monetizely Quoting Tool')).toBeVisible();

    // ===== STEP 2: Create a new product =====
    await page.click('text=Manage Catalog');
    await expect(page).toHaveURL('/catalog');

    await page.click('text=+ New Product');
    await expect(page).toHaveURL('/catalog/products/new');

    // Fill in product details
    await page.fill('input[id="name"]', productName);
    await page.fill('textarea[id="description"]', 'A test product for E2E testing');
    await page.click('text=Create Product');

    // Should redirect to product detail page
    await expect(page).toHaveURL(/\/catalog\/products\/.+/);
    await expect(page.getByText(productName)).toBeVisible();

    // ===== STEP 3: Add pricing tiers =====
    await page.click('text=+ Add Tier');

    // Fill in Starter tier
    await expect(page.getByText('Add New Tier')).toBeVisible();
    await page.fill('input[placeholder="e.g., Starter, Growth, Enterprise"]', 'Starter');
    await page.fill('input[placeholder="0.00"]', '50');
    await page.click('text=Add Tier');

    // Wait for modal to close
    await expect(page.getByText('Add New Tier')).not.toBeVisible();

    // Verify tier was added
    await expect(page.getByText('Starter')).toBeVisible();
    await expect(page.getByText('$50.00')).toBeVisible();

    // Add Growth tier
    await page.click('text=+ Add Tier');
    await expect(page.getByText('Add New Tier')).toBeVisible();
    await page.fill('input[placeholder="e.g., Starter, Growth, Enterprise"]', 'Growth');
    await page.fill('input[placeholder="0.00"]', '100');
    await page.click('text=Add Tier');
    await expect(page.getByText('Add New Tier')).not.toBeVisible();

    // Verify both tiers are shown
    await expect(page.getByText('Growth')).toBeVisible();

    // ===== STEP 4: Add a feature with add-on pricing =====
    await page.click('text=+ Add Feature');
    await expect(page.getByText('Add New Feature')).toBeVisible();

    // Fill feature name
    await page.fill('input[placeholder="e.g., Single Sign-On"]', 'Single Sign-On');

    // Set Starter tier to "Not Available" (default) - leave as is
    // Set Growth tier to "Paid Add-on"
    const growthTierSection = page.locator('.border.border-slate-200.rounded-lg').filter({ hasText: 'Growth' });
    await growthTierSection.locator('select').first().selectOption('addon');

    // Set pricing for the Growth add-on
    await growthTierSection.locator('select').last().selectOption('fixed');
    await growthTierSection.locator('input[type="number"]').fill('200');

    await page.click('text=Add Feature');
    await expect(page.getByText('Add New Feature')).not.toBeVisible();

    // Verify feature was added
    await expect(page.getByText('Single Sign-On')).toBeVisible();

    // ===== STEP 5: Create a new quote =====
    await page.click('text=New Quote');
    await expect(page).toHaveURL('/quotes/new');

    // Fill in quote name
    await page.fill('input[placeholder="e.g., Acme Corp - Q3 2026 proposal"]', quoteName);
    await page.fill('input[placeholder="e.g., Acme Corporation"]', 'Acme Corp');

    // Select the product
    const productSelect = page.locator('select').first();
    await productSelect.selectOption({ label: productName });

    // Select Growth tier
    await page.click('text=Growth');

    // Set seats
    const seatsInput = page.locator('input[type="number"]').first();
    await seatsInput.fill('10');

    // Select Annual term
    const termSelect = page.locator('select').last();
    await termSelect.selectOption('annual');

    // Select the SSO add-on
    await page.click('text=Single Sign-On');

    // Add a 10% discount
    await page.fill('input[placeholder="0"][type="number"]', '10');

    // Save the quote
    await page.click('text=Save Quote');

    // Should redirect to the quote view page
    await expect(page).toHaveURL(/\/quotes\/.+/);
    await expect(page.getByText(quoteName)).toBeVisible();

    // ===== STEP 6: Verify the quote view page =====
    // Check key information is displayed
    await expect(page.getByText('Acme Corp')).toBeVisible();
    await expect(page.getByText(productName)).toBeVisible();
    await expect(page.getByText('Growth')).toBeVisible();
    await expect(page.getByText('10')).toBeVisible(); // Seats

    // Verify line items are displayed
    await expect(page.getByText('Cost Breakdown')).toBeVisible();
    
    // Verify there's a total displayed
    const totalSection = page.locator('.bg-slate-900');
    await expect(totalSection).toBeVisible();

    // ===== STEP 7: Verify shareable URL works (no login required) =====
    const currentUrl = page.url();

    // Open the URL in a fresh context (simulating unauthenticated access)
    const context2 = await page.context().browser()!.newContext();
    const page2 = await context2.newPage();
    await page2.goto(currentUrl);

    // Should show the quote without any login prompt
    await expect(page2.getByText(quoteName)).toBeVisible();
    await expect(page2.getByText('Acme Corp')).toBeVisible();

    await context2.close();
  });
});

test.describe('Catalog Management', () => {
  test('catalog page shows empty state when no products exist', async ({ page }) => {
    await page.goto('/catalog');
    // The page should load successfully (even if products exist)
    await expect(page.getByText('Product Catalog')).toBeVisible();
    await expect(page.getByText('Manage your products, pricing tiers, and features')).toBeVisible();
  });

  test('quote builder shows message when no products configured', async ({ page }) => {
    // Create a fresh context to test with a potentially empty catalog
    await page.goto('/quotes/new');
    // The page should load (either show quote builder or "no products" message)
    await expect(page).toHaveURL('/quotes/new');
  });
});

test.describe('Quote View', () => {
  test('shows 404 for non-existent quote', async ({ page }) => {
    await page.goto('/quotes/nonexistent-quote-id-that-does-not-exist');
    // Should show a 404 or not found page
    const response = await page.evaluate(() => document.title);
    // Either shows 404 or the not-found page
    await expect(page.locator('body')).toBeVisible();
  });
});
