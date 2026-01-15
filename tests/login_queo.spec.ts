import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = process.env.BASE_URL || 'https://yanine.queo.dev';

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

  // Aumentar timeout a 60 segundos para esta navegación
  await page.goto(`${BASE_URL}/login`, { 
    waitUntil: 'domcontentloaded', // Espera solo a que el DOM esté listo
    timeout: 60000 
  });
  await page.getByRole('textbox', { name: 'Correo electrónico' }).click();
  await page.getByRole('textbox', { name: 'Correo electrónico' }).click();
  await page.getByRole('textbox', { name: 'Correo electrónico' }).fill('userrfid2109@refactor.com');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('userrfid2109');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.goto(`${BASE_URL}/work-areas?searchType=search&`);
});