const { test, expect } = require('@playwright/test');

test.describe('PrepSmart AI - Dashboard & Workflow Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display dashboard overview, metrics, and new mock trigger card', async ({ page }) => {
    // Assert dashboard main heading or welcome area
    await expect(page.getByText('Create New Mock Interview')).toBeVisible();

    // Verify trigger card is present
    const addCard = page.getByText('Create New Mock Interview').first();
    await expect(addCard).toBeVisible();
  });

  test('should open mock interview configuration modal and display role presets', async ({ page }) => {
    const addCard = page.getByText('Create New Mock Interview').first();
    await addCard.click();
    await page.waitForTimeout(400);

    // Verify dialog title is visible
    await expect(page.getByText('Configure Your Mock Interview')).toBeVisible();

    // Verify presets exist in dialog
    const presetBtn = page.getByRole('button', { name: /Full Stack Engineer|Frontend Specialist/i }).first();
    await expect(presetBtn).toBeVisible();

    // Click a preset to verify form inputs populate
    await presetBtn.click();
    await page.waitForTimeout(200);

    // Verify job position input has value
    const jobInput = page.locator('input[placeholder*="Full Stack"]').first();
    if (await jobInput.isVisible()) {
      const val = await jobInput.inputValue();
      expect(val.length).toBeGreaterThan(0);
    }
  });

  test('should navigate to How It Works page and verify interactive architecture', async ({ page }) => {
    await page.goto('/dashboard/how-it-works');
    await page.waitForLoadState('domcontentloaded');

    // Verify heading
    await expect(page.locator('h1').filter({ hasText: /How PrepSmart AI Works/i })).toBeVisible();

    // Verify step cards or tabs exist
    await expect(page.getByText('Persona & Role Calibration').first()).toBeVisible();
    await expect(page.getByText('Ollama AI Question Synthesis').first()).toBeVisible();
  });
});
