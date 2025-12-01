import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const USER_EMAIL = process.env.USER_EMAIL || '';
const USER_PASSWORD = process.env.USER_PASSWORD || '';
const BASE_URL = process.env.BASE_URL || 'https://alex.queo.dev';

test('test', async ({ page }) => {
  // Maximizar la ventana del navegador a pantalla completa
  await page.setViewportSize({ width: 1920, height: 1080 });
  // También intentar maximizar si es posible
  try {
    await page.evaluate(() => {
      if (window.screen && window.screen.availWidth && window.screen.availHeight) {
        window.resizeTo(window.screen.availWidth, window.screen.availHeight);
      }
    });
  } catch (e) {
    // Ignorar si no se puede maximizar
  }
  
  await page.goto(`${BASE_URL}/login`);
  await page.getByRole('textbox', { name: 'Correo electrónico' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('textbox', { name: 'Correo electrónico' }).click();
  await page.getByRole('textbox', { name: 'Correo electrónico' }).fill(USER_EMAIL);
  await page.getByRole('textbox', { name: 'Correo electrónico' }).press('Tab');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(USER_PASSWORD);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.goto(`${BASE_URL}/work-areas?searchType=search&`);
  await page.getByRole('link', { name: 'Jhon Alexander Betancur' }).click();
  await page.getByRole('button', { name: ' Salir' }).click();
});