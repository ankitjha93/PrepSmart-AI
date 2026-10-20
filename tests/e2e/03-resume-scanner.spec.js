const { test, expect } = require('@playwright/test');

test.describe('PrepSmart AI - Resume Scanner & ATS Cockpit Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/resume-scanner');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display resume scanner header, upload dropzone, and presets', async ({ page }) => {
    // Assert title is visible
    await expect(page.locator('h1').filter({ hasText: /Resume Scanner|ATS Match/i }).first()).toBeVisible();

    // Verify 1-click engineering presets are present
    const presetBtn = page.getByRole('button', { name: /Full Stack Lead|Staff AI/i }).first();
    await expect(presetBtn).toBeVisible();

    // Verify resume textarea is present
    const resumeTextarea = page.locator('textarea').first();
    await expect(resumeTextarea).toBeVisible();
  });

  test('should load preset engineering resume on click', async ({ page }) => {
    const presetBtn = page.getByRole('button', { name: /Full Stack Lead/i }).first();
    await presetBtn.click();
    await page.waitForTimeout(400);

    // Verify textarea populated with preset text
    const resumeTextarea = page.locator('textarea').first();
    const content = await resumeTextarea.inputValue();
    expect(content.length).toBeGreaterThan(100);
    expect(content).toContain('ALEX RIVERA');
  });

  test('should run ATS audit on preset resume and display match results', async ({ page }) => {
    // Load preset
    const presetBtn = page.getByRole('button', { name: /Full Stack Lead/i }).first();
    await presetBtn.click();
    await page.waitForTimeout(300);

    // Click Audit Resume button
    const auditBtn = page.getByRole('button', { name: /Audit Resume & Generate Tailored Mocks/i }).first();
    await expect(auditBtn).toBeEnabled();
    await auditBtn.click();

    // Wait for the audit process to finish and verify results UI using canonical getByText
    await expect(page.getByText('ATS Match Index')).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('button', { name: /Copy Full Prep Dossier/i })).toBeVisible();
  });
});
