import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const USER_EMAIL = process.env.USER_EMAIL || '';
const USER_PASSWORD = process.env.USER_PASSWORD || '';
const BASE_URL = process.env.BASE_URL || 'https://alex.queo.dev';

test('Editar propiedad', async ({ page }) => {
  try {
    // ========== VISTA 1: LOGIN ==========
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Validar elementos del login
    await expect(page.getByRole('textbox', { name: 'Correo electrónico' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();
    
    // Login
    await page.getByRole('textbox', { name: 'Correo electrónico' }).fill(USER_EMAIL);
    await page.getByRole('textbox', { name: 'Contraseña' }).fill(USER_PASSWORD);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    
    // Esperar a que se complete el login
    await page.waitForLoadState('networkidle');
    
    // ========== VISTA 2: NAVEGAR A COPROPIEDADES ==========
    await page.getByRole('button', { name: 'Organización' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('link', { name: 'Copropiedades' }).click();
    await page.waitForLoadState('networkidle');
    
    // Aquí puedes agregar los pasos para editar la propiedad
    // Por ejemplo: buscar la propiedad, hacer click en editar, modificar campos, etc.
    
  } catch (error) {
    console.log('❌ Test falló. Pausando para debug...');
    await page.pause();
    throw error;
  }
});