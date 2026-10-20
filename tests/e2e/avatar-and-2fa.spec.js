import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('2FA Setup & Profile Avatar Persistence', () => {
  test('2FA setup opens without ReferenceError and supports TOTP copy and verification in demo mode', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    // 1. Sign in via 1-Click Demo
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');

    const demoButton = page.getByRole('button', { name: /Instant 1-Click Test Drive/i });
    await expect(demoButton).toBeVisible();
    await demoButton.click();

    await page.waitForURL((url) => url.pathname.includes('/dashboard'), { timeout: 15000 });
    expect(page.url()).toContain('/dashboard');

    // Dismiss onboarding if shown
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

    // 3. Switch to Security Tab
    const securityTab = page.getByRole('button', { name: /Password & 2FA/i });
    await expect(securityTab).toBeVisible();
    await securityTab.click();

    // 4. Click "Manage 2FA"
    const manage2faBtn = page.getByRole('button', { name: /Manage 2FA/i });
    await expect(manage2faBtn).toBeVisible();
    await manage2faBtn.click();

    // 5. Click "Set Up Authenticator App"
    const setup2faBtn = page.getByRole('button', { name: /Set Up Authenticator App/i });
    await expect(setup2faBtn).toBeVisible();
    await setup2faBtn.click();

    // Ensure NO "ReferenceError: copied is not defined" occurred
    const hasCopiedReferenceError = pageErrors.some((msg) => msg.includes('copied is not defined'));
    expect(hasCopiedReferenceError).toBe(false);
    expect(pageErrors.length).toBe(0);

    // 6. Verify enrollment screen is shown with TOTP secret and QR code
    const totpCodeDisplay = page.locator('code');
    await expect(totpCodeDisplay.first()).toBeVisible({ timeout: 5000 });

    // Click the copy secret button
    const copySecretBtn = page.getByLabel('Copy secret key');
    await expect(copySecretBtn).toBeVisible();
    await copySecretBtn.click();

    // Confirm still no page errors after clicking copy
    expect(pageErrors.filter((msg) => msg.includes('copied')).length).toBe(0);

    // 7. Enter 6-digit TOTP verification code
    const verifyInput = page.getByPlaceholder('000000');
    await expect(verifyInput).toBeVisible();
    await verifyInput.fill('123456');

    // 8. Click "Verify & Activate"
    const activateBtn = page.getByRole('button', { name: /Verify & Activate/i });
    await expect(activateBtn).toBeVisible();
    await activateBtn.click();

    // Verify transition to backup codes step
    await expect(page.getByText(/Save Your Emergency Backup Codes/i)).toBeVisible({ timeout: 8000 });
  });

  test('uploaded profile photo persists in header and across page reloads', async ({ page }) => {
    // 1. Sign in via 1-Click Demo
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');

    const demoButton = page.getByRole('button', { name: /Instant 1-Click Test Drive/i });
    await expect(demoButton).toBeVisible();
    await demoButton.click();

    await page.waitForURL((url) => url.pathname.includes('/dashboard'), { timeout: 15000 });

    // Dismiss onboarding if shown
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

    // 3. Upload a new avatar image
    // Generate a distinct 10x10 colored PNG
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJAD+/uQ91pAAAAAElFTkSuQmCC',
      'base64'
    );

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'avatar-test.png',
      mimeType: 'image/png',
      buffer: testImageBuffer,
    });

    // 4. Wait for upload success toast or preview update
    await expect(page.getByText(/Profile avatar updated successfully!/i)).toBeVisible({ timeout: 8000 });

    // Close the settings dialog
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // 5. Check the AvatarImage src attribute in Header
    const avatarImg = page.locator('header button[aria-label="User profile menu"] img');
    await expect(avatarImg).toBeVisible();
    const initialAvatarSrc = await avatarImg.getAttribute('src');
    expect(initialAvatarSrc).toBeTruthy();
    expect(
      initialAvatarSrc.startsWith('data:image') || 
      initialAvatarSrc.includes('supabase.co/storage') ||
      initialAvatarSrc.includes('avatars')
    ).toBe(true);

    // 6. Reload the page to test persistence
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 7. Verify avatar still persists in header
    const reloadedAvatarImg = page.locator('header button[aria-label="User profile menu"] img');
    await expect(reloadedAvatarImg).toBeVisible({ timeout: 8000 });
    const persistedAvatarSrc = await reloadedAvatarImg.getAttribute('src');
    expect(persistedAvatarSrc).toBeTruthy();
    expect(
      persistedAvatarSrc.startsWith('data:image') || 
      persistedAvatarSrc.includes('supabase.co/storage') ||
      persistedAvatarSrc.includes('avatars')
    ).toBe(true);
  });
});
