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

  test('health endpoint responds', async ({ request }) => {
    const response = await request.get('/api/health');
    expect([200, 503]).toContain(response.status());
    const body = await response.json();
    expect(body).toEqual(
      expect.objectContaining({
        zones: expect.any(Array),
        overall: expect.stringMatching(/healthy|degraded|unhealthy/),
      })
    );
  });
});
