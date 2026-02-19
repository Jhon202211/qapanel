import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = process.env.BASE_URL || 'https://alex.queo.dev';
const USER_EMAIL = process.env.USER_EMAIL;
const USER_PASSWORD = process.env.USER_PASSWORD;

test('test', async ({ page }) => {
  test.skip(!USER_EMAIL || !USER_PASSWORD, 'Definir USER_EMAIL y USER_PASSWORD en .env');

  await page.goto(`${BASE_URL}/login`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await page.getByRole('textbox', { name: 'Correo electrónico' }).fill(USER_EMAIL!);
  // Campo contraseña: id="password" (visto en DevTools)
  await page.locator('#password').fill(USER_PASSWORD!);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.goto(`${BASE_URL}/work-areas?searchType=search&`);
});