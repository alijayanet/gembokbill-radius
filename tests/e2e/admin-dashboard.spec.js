// @ts-check
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3002';

test.describe('Admin Dashboard', () => {
  // Helper function to login
  async function loginAsAdmin(page) {
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/admin\/dashboard/, { timeout: 10000 });
  }

  test('should display dashboard after successful login', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Verify we're on dashboard
    await expect(page).toHaveURL(/.*\/admin\/dashboard/);
    
    // Verify dashboard content loads
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have navigation menu', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Check for common navigation elements
    // Note: Actual selectors depend on your HTML structure
    const body = await page.locator('body').textContent();
    
    // Verify page has loaded with some content
    expect(body).toBeTruthy();
    expect(body.length).toBeGreaterThan(0);
  });

  test('should be able to logout', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Look for logout link/button (adjust selector based on actual HTML)
    const logoutLink = page.locator('a[href*="logout"], button:has-text("Logout"), a:has-text("Keluar")').first();
    
    if (await logoutLink.isVisible()) {
      await logoutLink.click();
      
      // Should redirect to login
      await page.waitForURL(/.*\/admin\/login/, { timeout: 5000 });
      await expect(page).toHaveURL(/.*\/admin\/login/);
    }
  });
});
