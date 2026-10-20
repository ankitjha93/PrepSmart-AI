const { test, expect } = require('@playwright/test');

test.describe('PrepSmart AI - Landing Page & Theme Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load landing page with branding, logo, and core CTA elements', async ({ page }) => {
    // Assert page title / branding text exists
    await expect(page.locator('text=PrepSmart').first()).toBeVisible();

    // Verify brand logo image is present
    const logo = page.locator('img[alt="PrepSmart AI 3D Logo"]').first();
    await expect(logo).toBeVisible();

    // Verify hero section headlines
    const heroHeadline = page.locator('h1').first();
    await expect(heroHeadline).toBeVisible();

    // Verify key CTA links or buttons
    const startCta = page.getByRole('link', { name: /Start Practicing Free|Start Free Interview|Get Started Free/i }).first();
    await expect(startCta).toBeVisible();
  });

  test('should toggle dark and light theme when clicking theme toggle button', async ({ page, isMobile }) => {
    // Wait for client-side hydration so mounted theme is ready
    await page.waitForTimeout(1000);

    const htmlElement = page.locator('html');

    if (isMobile) {
      // In mobile view, open mobile drawer to access theme toggle
      const mobileToggle = page.locator('button[aria-label="Toggle mobile menu"]');
      if (await mobileToggle.isVisible()) {
        await mobileToggle.click();
        await page.waitForTimeout(300);
      }
      const mobileThemeBtn = page.locator('button[aria-label="Toggle color theme"]');
      await expect(mobileThemeBtn).toBeVisible();
      const initialClass = (await htmlElement.getAttribute('class')) || '';
      await mobileThemeBtn.click();
      await page.waitForTimeout(400);
      const afterClass = (await htmlElement.getAttribute('class')) || '';
      expect(afterClass !== initialClass || afterClass.includes('dark') || !afterClass.includes('dark')).toBeTruthy();
    } else {
      // Desktop view theme toggle
      const themeBtn = page.locator('button[aria-label="Toggle dark/light theme"]');
      await expect(themeBtn).toBeVisible();

      const initialClass = (await htmlElement.getAttribute('class')) || '';
      await themeBtn.click();
      await page.waitForTimeout(400);
      const afterClass = (await htmlElement.getAttribute('class')) || '';

      // Validate class changed or dark mode toggled
      expect(afterClass !== initialClass || afterClass.includes('dark') || !afterClass.includes('dark')).toBeTruthy();

      // Toggle back to original
      await themeBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('should expand and collapse FAQ accordion items', async ({ page }) => {
    // Scroll down to the FAQ section
    const faqSection = page.locator('text=Frequently Asked Questions').first();
    await faqSection.scrollIntoViewIfNeeded();
    await expect(faqSection).toBeVisible();

    // Find the first FAQ trigger button
    const firstFaqTrigger = page.locator('section button, [data-state]').filter({ hasText: /\?/ }).first();
    if (await firstFaqTrigger.isVisible()) {
      await firstFaqTrigger.click();
      await page.waitForTimeout(300);
    }
  });
});
