const { test, expect } = require('@playwright/test');

test.describe('PrepSmart AI - Question Bank Cockpit Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/questions');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display question bank header and stats', async ({ page }) => {
    await expect(page.locator('h1').filter({ hasText: /Interview Question Bank/i }).first()).toBeVisible();
    await expect(page.locator('input[placeholder*="Search"]').first()).toBeVisible();
  });

  test('should filter questions by search query', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('React');
    await page.waitForTimeout(400);

    // Verify search results contain React-related topics
    const questionCards = page.locator('h3').filter({ hasText: /React/i });
    await expect(questionCards.first()).toBeVisible();
  });

  test('should filter questions when clicking category chips', async ({ page }) => {
    // Click on Frontend filter
    const frontendChip = page.getByRole('button', { name: /Frontend/i }).first();
    if (await frontendChip.isVisible()) {
      await frontendChip.click();
      await page.waitForTimeout(300);
      await expect(page.locator('text=Frontend').first()).toBeVisible();
    }

    // Click on Backend filter
    const backendChip = page.getByRole('button', { name: /Backend/i }).first();
    if (await backendChip.isVisible()) {
      await backendChip.click();
      await page.waitForTimeout(300);
      await expect(page.locator('text=Backend').first()).toBeVisible();
    }
  });

  test('should expand question card to reveal answer and tips', async ({ page }) => {
    // Find first expandable question card button
    const expandBtn = page.getByRole('button', { name: /View Model Solution & Rubrics/i }).first();
    await expect(expandBtn).toBeVisible();
    await expandBtn.click();
    await page.waitForTimeout(400);

    // Verify expanded ideal answer or rubric section
    await expect(page.locator('text=Ideal Model Answer').first()).toBeVisible();
    await expect(page.locator('text=What Interviewers Look For').first()).toBeVisible();
  });
});
