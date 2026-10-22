const { test, expect } = require('@playwright/test');

test.describe('PrepSmart AI - Upgrade & Pricing Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/upgrade');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display pricing header and 3 plan tiers', async ({ page }) => {
    await expect(page.locator('h1').filter({ hasText: /Supercharge Your Tech Career/i })).toBeVisible();

    // Verify 3 plan tiers are rendered
    await expect(page.locator('text=Starter Community').first()).toBeVisible();
    await expect(page.locator('text=Pro Candidate').first()).toBeVisible();
    await expect(page.locator('text=Executive Accelerator').first()).toBeVisible();
  });

  test('should toggle between monthly and annual billing cycles and adjust discount tags', async ({ page }) => {
    // Use exact start-of-string regex to prevent colliding with FAQ question accordions
    const monthlyBtn = page.getByRole('button', { name: /^Monthly Billing$/i });
    const annualBtn = page.getByRole('button', { name: /^Annual Billing/i });

    await expect(monthlyBtn).toBeVisible();
    await expect(annualBtn).toBeVisible();

    // Click Monthly
    await monthlyBtn.click();
    await page.waitForTimeout(300);
    await expect(monthlyBtn).toHaveClass(/bg-white/);

    // Click Annual
    await annualBtn.click();
    await page.waitForTimeout(300);
    await expect(annualBtn).toHaveClass(/bg-blue-600/);
    await expect(page.locator('text=Save 25%').first()).toBeVisible();
  });

  test('should display feature matrix comparison table and FAQs', async ({ page }) => {
    // Scroll down to feature comparison matrix
    const matrixTitle = page.locator('text=Compare All Features Side-by-Side').first();
    await matrixTitle.scrollIntoViewIfNeeded();
    await expect(matrixTitle).toBeVisible();

    // Verify FAQ accordion exists
    const faqTitle = page.locator('text=Common Questions About Upgrading').first();
    await faqTitle.scrollIntoViewIfNeeded();
    await expect(faqTitle).toBeVisible();
  });

  test('should switch between INR and USD currencies and display Razorpay trust badge', async ({ page }) => {
    // Check Razorpay security text
    await expect(page.locator('text=Bank-Grade 256-Bit Razorpay Security')).toBeVisible();

    // Check currency buttons
    const inrBtn = page.getByRole('button', { name: /₹ INR/i });
    const usdBtn = page.getByRole('button', { name: /\$ USD/i });

    await expect(inrBtn).toBeVisible();
    await expect(usdBtn).toBeVisible();

    // Default INR shows ₹ symbol in price
    await expect(page.locator('text=₹699').first()).toBeVisible();

    // Switch to USD
    await usdBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=$11').first()).toBeVisible();

    // Switch back to INR
    await inrBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=₹699').first()).toBeVisible();
  });
});
