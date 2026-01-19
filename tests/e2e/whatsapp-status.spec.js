// @ts-check
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3002';

test.describe('WhatsApp Integration Status', () => {
  test('should return WhatsApp connection status via API', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/whatsapp/status`);
    
    // Verify response
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    // Verify JSON response
    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('connected');
  });

  test('should display health check status', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/health`);
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data.status).toBe('ok');
    expect(data).toHaveProperty('whatsapp');
  });
});
