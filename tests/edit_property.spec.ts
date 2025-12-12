import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const USER_EMAIL = process.env.USER_EMAIL || '';
const USER_PASSWORD = process.env.USER_PASSWORD || '';
const BASE_URL = process.env.BASE_URL || 'https://alex.queo.dev';
const PROPERTY_TO_EDIT = process.env.PROPERTY_TO_EDIT || '';
test('Editar propiedad', async ({ page }) => {
  try {
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
    
    await page.getByRole('textbox', { name: 'Escriba el término para' }).click();
    await page.getByRole('textbox', { name: 'Escriba el término para' }).fill(PROPERTY_TO_EDIT);
    await page.waitForTimeout(1000);
    
    // Hacer click en la propiedad encontrada
    await page.getByText('QA Prueba Auto (No tocar)').click();
    await page.waitForTimeout(1000);
    
    // Buscar el NIT dentro del contexto de la propiedad seleccionada
    // Usar first() para seleccionar el primer NIT visible después de seleccionar la propiedad
    await page.getByText('NIT').first().click();
    await page.waitForTimeout(500);
    
    // Buscar el botón de editar usando un selector más específico
    // El testId 'button-undefined' puede no ser confiable, intentar buscar por texto o rol
    const editButton = page.getByTestId('button-undefined').or(page.getByRole('button', { name: /editar|edit/i })).first();
    await editButton.click();
    await page.waitForTimeout(1000);
    await page.getByTestId('input-phone').click();
    await page.getByTestId('input-phone').fill('1234569999');
    await page.getByRole('button', { name: 'Editar datos básicos' }).click();
    await page.getByRole('button', { name: 'OK' }).click();
  
    // ---------------------
  

    
  } catch (error) {
    console.log('❌ Test falló. Pausando para debug...');
    await page.pause();
    throw error;
  }
});