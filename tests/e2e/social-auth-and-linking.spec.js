import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Google & GitHub OAuth and Account Linking', () => {
  test('sign-in and sign-up pages display Google and GitHub buttons and handle clicks gracefully', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // 1. Check Sign-In Page
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');

    const googleSignInBtn = page.getByRole('button', { name: 'Google' });
    const githubSignInBtn = page.getByRole('button', { name: 'GitHub' });

    await expect(googleSignInBtn).toBeVisible();
    await expect(githubSignInBtn).toBeVisible();

    // Clicking Google button should not throw unhandled runtime errors
    await googleSignInBtn.click();
    await page.waitForTimeout(1000);
    expect(pageErrors.length).toBe(0);

    // 2. Check Sign-Up Page
    await page.goto('/sign-up');
    await page.waitForLoadState('networkidle');

    const googleSignUpBtn = page.getByRole('button', { name: 'Google' });
    const githubSignUpBtn = page.getByRole('button', { name: 'GitHub' });

    await expect(googleSignUpBtn).toBeVisible();
    await expect(githubSignUpBtn).toBeVisible();

    // Clicking GitHub button should not throw unhandled runtime errors
    await githubSignUpBtn.click();
    await page.waitForTimeout(1000);
    expect(pageErrors.length).toBe(0);
  });

  test('candidates can connect and disconnect Google and GitHub accounts with persistence in Account Settings', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // 1. Sign in via 1-Click Demo Candidate
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');

    const demoButton = page.getByRole('button', { name: /Instant 1-Click Test Drive/i });
    await expect(demoButton).toBeVisible();
    await demoButton.click();

    await page.waitForURL((url) => url.pathname.includes('/dashboard'), { timeout: 15000 });
    expect(page.url()).toContain('/dashboard');

    // Dismiss onboarding dialog if shown
    const finishOnboarding = page.getByRole('button', { name: /Save & Enter Dashboard/i });
    if (await finishOnboarding.isVisible({ timeout: 4000 }).catch(() => false)) {
      await finishOnboarding.click();
    }

    // 2. Open Account Settings Dialog
    const profileTrigger = page.getByLabel('User profile menu');
    await expect(profileTrigger).toBeVisible();
    await profileTrigger.click();

    const settingsOption = page.getByRole('button', { name: /Account & Security Settings/i });
    await expect(settingsOption).toBeVisible();
    await settingsOption.click();

    // 3. Switch to Connected Accounts tab
    const connectedAccountsTab = page.getByRole('button', { name: /Connected Accounts/i });
    await expect(connectedAccountsTab).toBeVisible();
    await connectedAccountsTab.click();

    // 4. Verify Google and GitHub cards exist
    await expect(page.getByText('Google Identity')).toBeVisible();
    await expect(page.getByText('GitHub Developer Identity')).toBeVisible();

    // 5. Connect Google Identity
    const googleConnectBtn = page.getByLabel('Connect Google account');
    await expect(googleConnectBtn).toBeVisible();
    await googleConnectBtn.click();

    // Toast notification should announce success
    await expect(page.getByText(/Google account connected!/i)).toBeVisible({ timeout: 5000 });

    // Disconnect button should now appear
    const googleDisconnectBtn = page.getByLabel('Disconnect Google account');
    await expect(googleDisconnectBtn).toBeVisible();

    // 6. Connect GitHub Identity
    const githubConnectBtn = page.getByLabel('Connect GitHub account');
    await expect(githubConnectBtn).toBeVisible();
    await githubConnectBtn.click();

    await expect(page.getByText(/Github account connected!/i)).toBeVisible({ timeout: 5000 });
    const githubDisconnectBtn = page.getByLabel('Disconnect GitHub account');
    await expect(githubDisconnectBtn).toBeVisible();

    // 7. Verify persistence across page reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Reopen Account Settings
    await page.getByLabel('User profile menu').click();
    await page.getByRole('button', { name: /Account & Security Settings/i }).click();
    await page.getByRole('button', { name: /Connected Accounts/i }).click();

    // Confirm both are still connected
    await expect(page.getByLabel('Disconnect Google account')).toBeVisible();
    await expect(page.getByLabel('Disconnect GitHub account')).toBeVisible();

    // 8. Disconnect Google Identity
    await page.getByLabel('Disconnect Google account').click();
    await expect(page.getByText(/Google disconnected successfully/i)).toBeVisible({ timeout: 5000 });

    // Verify Google shows "Connect" button again while GitHub remains connected
    await expect(page.getByLabel('Connect Google account')).toBeVisible();
    await expect(page.getByLabel('Disconnect GitHub account')).toBeVisible();

    expect(pageErrors.length).toBe(0);
  });
});
