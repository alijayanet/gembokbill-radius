// @ts-check
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3002';

test.describe('Customer Portal', () => {
  test('should display customer login page', async ({ page }) => {
    await page.goto(`${BASE_URL}/customer/login`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Verify page has loaded (check for any form or login-related content)
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    
    // Check if it's a login page (flexible check)
    const hasLoginElements = await page.locator('input[type="text"], input[type="password"], button[type="submit"]').count();
    expect(hasLoginElements).toBeGreaterThan(0);
  });

  test('should redirect to login when accessing protected pages', async ({ page }) => {
    // Try to access customer billing without login
    await page.goto(`${BASE_URL}/customer/billing`);
    
    // Should redirect to login
    await page.waitForURL(/.*\/customer\/login/, { timeout: 5000 });
    await expect(page).toHaveURL(/.*\/customer\/login/);
  });

  test('should show isolir page with company info', async ({ page }) => {
    await page.goto(`${BASE_URL}/isolir`);
    
    // Verify page loads
    await expect(page.locator('body')).toBeVisible();
    
    // Check for company header (use first() to avoid strict mode violation)
    const companyHeader = page.locator('text=/GEMBOK/i').first();
    await expect(companyHeader).toBeVisible();
    
    // Verify page contains expected content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain('GEMBOK');
  });
});
