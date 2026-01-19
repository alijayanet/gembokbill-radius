// @ts-check
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3002';

test.describe('Admin Login Flow', () => {
  test('should display admin login page correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    
    // Verify page title
    await expect(page).toHaveTitle(/Admin Login/);
    
    // Verify form elements exist
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Verify mobile login link
    await expect(page.locator('a[href="/admin/login/mobile"]')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    
    // Fill login form
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForURL(/.*\/admin\/dashboard/, { timeout: 10000 });
    
    // Verify we're on dashboard
    await expect(page).toHaveURL(/.*\/admin\/dashboard/);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    
    // Fill with wrong credentials
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for error toast
    await page.waitForSelector('.toast', { timeout: 5000 });
    
    // Verify error message appears
    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/Login Failed|salah/i);
  });

  test('should show validation error for empty fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    
    // Try to submit without filling fields
    await page.click('button[type="submit"]');
    
    // HTML5 validation should prevent submission
    const usernameInput = page.locator('input[name="username"]');
    const isInvalid = await usernameInput.evaluate((el) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  test('should navigate to mobile login page', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    
    // Click mobile login link
    await page.click('a[href="/admin/login/mobile"]');
    
    // Verify navigation
    await expect(page).toHaveURL(/.*\/admin\/login\/mobile/);
  });
});
