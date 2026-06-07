import { test, expect } from '@playwright/test';

test.describe('Main app smoke', () => {
  test('sign-in page renders', async ({ page }) => {
    const response = await page.goto('/sign-in');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('health endpoint responds', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBeLessThan(500);
  });
});
