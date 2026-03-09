import { type Page, type BrowserContext, request } from '@playwright/test';

const API_URL = 'http://localhost:3001';

/**
 * Reset the test database — call before each test suite run.
 */
export async function resetTestDatabase() {
  const ctx = await request.newContext();
  await ctx.post(`${API_URL}/api/auth/test-reset`);
  await ctx.dispose();
}

/**
 * Create a test user via the test-login endpoint and set the JWT in localStorage.
 * Returns the user object and token.
 */
export async function loginAsTestUser(
  page: Page,
  username: string
): Promise<{ token: string; user: { id: number; username: string } }> {
  // Get token from backend
  const response = await page.request.post(`${API_URL}/api/auth/test-login`, {
    data: { username },
  });
  const data = await response.json();
  const { token, user } = data;

  // Set localStorage before navigation by using addInitScript
  // This ensures the token is set before any page JS runs
  await page.addInitScript(
    ({ token, user }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    { token, user }
  );

  // Navigate to home — localStorage is already set, app should see us as logged in
  await page.goto('/');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10_000 });

  return { token, user };
}

/**
 * Make an authenticated API call directly (bypass UI).
 */
export async function apiCall(
  page: Page,
  method: string,
  path: string,
  token: string,
  body?: any
) {
  const options: any = {
    headers: { Authorization: `Bearer ${token}` },
  };
  if (body) {
    options.data = body;
  }

  if (method === 'GET') {
    return page.request.get(`${API_URL}${path}`, options);
  } else if (method === 'POST') {
    return page.request.post(`${API_URL}${path}`, options);
  } else if (method === 'PUT') {
    return page.request.put(`${API_URL}${path}`, options);
  } else if (method === 'DELETE') {
    return page.request.delete(`${API_URL}${path}`, options);
  }
  throw new Error(`Unknown method: ${method}`);
}

/**
 * Create a dish via the API (faster than going through UI for setup).
 */
export async function createDishViaApi(
  page: Page,
  token: string,
  data: { name: string; tier?: string; caption?: string; tags?: string[]; isPublic?: boolean }
) {
  const formData = new URLSearchParams();
  formData.append('name', data.name);
  if (data.tier) formData.append('tier', data.tier);
  if (data.caption) formData.append('caption', data.caption);
  if (data.tags) formData.append('tags', JSON.stringify(data.tags));
  if (data.isPublic !== undefined) formData.append('isPublic', String(data.isPublic));

  const response = await page.request.post(`${API_URL}/api/dishes`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: formData.toString(),
  });
  const json = await response.json();
  return json.dish;
}
