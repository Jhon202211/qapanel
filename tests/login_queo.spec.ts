import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = process.env.BASE_URL || 'https://alex.queo.dev';

test('test', async ({ page }) => {
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