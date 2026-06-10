import { test, expect } from '@playwright/test';

test.describe('Main app smoke', () => {
  test('sign-in page renders', async ({ page }) => {
    const response = await page.goto('sign-in');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('root page responds', async ({ request }) => {
    const response = await request.get('.');
    expect(response.status()).toBeLessThan(500);
  });
});
