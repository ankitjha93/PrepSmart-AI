import { test, expect } from '@playwright/test';

// Use empty storage state to simulate a brand new visitor on a new device
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Dynamic Demo Accounts & Guest Default State', () => {
  test('new visitor on fresh device sees guest landing page without any default account', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Header must show Sign In and Get Started Free
    const signInButton = page.getByRole('link', { name: 'Sign In' });
    await expect(signInButton).toBeVisible();

    const getStartedButton = page.getByRole('button', { name: /Get Started Free/i });
    await expect(getStartedButton).toBeVisible();

    // Verify personal account is NOT present anywhere on the page
    const pageContent = await page.content();
    expect(pageContent).not.toContain('93ankitjha@gmail.com');
    expect(pageContent).not.toContain('Ankit Jha');
  });

  test('unauthenticated visitor trying to access dashboard is redirected to sign-in', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL((url) => url.pathname.includes('/sign-in'), { timeout: 10000 });
    expect(page.url()).toContain('/sign-in');
  });

  test('explicit demo mode dynamically generates candidate and allows sign-out', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');

    // Find and click the demo candidate button
    const demoButton = page.getByRole('button', { name: /Instant 1-Click Test Drive/i });
    await expect(demoButton).toBeVisible();
    await demoButton.click();

    // Should redirect to dashboard
    await page.waitForURL((url) => url.pathname.includes('/dashboard'), { timeout: 15000 });
    expect(page.url()).toContain('/dashboard');

    // Dismiss onboarding dialog if present
    const finishOnboarding = page.getByRole('button', { name: /Save & Enter Dashboard/i });
    if (await finishOnboarding.isVisible({ timeout: 4000 }).catch(() => false)) {
      await finishOnboarding.click();
    }

    // Profile menu trigger should be visible
    const profileTrigger = page.getByLabel('User profile menu');
    await expect(profileTrigger).toBeVisible();

    // Click profile menu to verify candidate details
    await profileTrigger.click();

    // Verify Demo Mode badge is present
    const demoBadge = page.getByText('DEMO MODE');
    await expect(demoBadge).toBeVisible();

    // Verify email is a dynamic prepsmart candidate email (not 93ankitjha@gmail.com)
    const emailLocator = page.locator('p:has-text("@prepsmart.ai")');
    await expect(emailLocator).toBeVisible();
    const candidateEmail = await emailLocator.innerText();
    expect(candidateEmail).toContain('@prepsmart.ai');
    expect(candidateEmail).not.toContain('93ankitjha@gmail.com');

    // Click Sign Out
    const signOutBtn = page.getByRole('button', { name: /Sign Out/i });
    await expect(signOutBtn).toBeVisible();
    await signOutBtn.click();

    // Should redirect to /sign-in
    await page.waitForURL((url) => url.pathname.includes('/sign-in'), { timeout: 10000 });
    expect(page.url()).toContain('/sign-in');

    // Navigating back to home should show guest state
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const signInButton = page.getByRole('link', { name: 'Sign In' });
    await expect(signInButton).toBeVisible();
  });
});
