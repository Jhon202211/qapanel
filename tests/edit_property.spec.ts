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
    
    // Buscar el botón de editar para entrar en modo edición
    const editButton = page.getByTestId('button-undefined').or(page.getByRole('button', { name: /editar|edit/i })).first();
    await editButton.waitFor({ state: 'visible', timeout: 5000 });
    await editButton.click();
    await page.waitForTimeout(1000);
    
    // Generar valores aleatorios para NIT y Teléfono
    const randomNit = Math.floor(1000000000 + Math.random() * 9000000000).toString(); // 10 dígitos
    const randomPhone = Math.floor(1000000 + Math.random() * 9000000).toString(); // 7 dígitos
    
    // Buscar el campo NIT usando testId o label
    const nitField = page.getByTestId('input-nit').or(page.locator('input[name="nit"]')).or(page.getByLabel(/nit/i));
    await nitField.waitFor({ state: 'visible', timeout: 5000 });
    await nitField.click();
    await nitField.clear();
    await nitField.fill(randomNit);
    await page.waitForTimeout(500);
    console.log(`✅ NIT aleatorio llenado: ${randomNit}`);
    
    // Buscar el campo Teléfono de contacto usando testId o label
    const phoneField = page.getByTestId('input-phone').or(page.locator('input[name="phone"]')).or(page.getByLabel(/teléfono/i));
    await phoneField.waitFor({ state: 'visible', timeout: 5000 });
    await phoneField.click();
    await phoneField.clear();
    await phoneField.fill(randomPhone);
    await page.waitForTimeout(500);
    console.log(`✅ Teléfono aleatorio llenado: ${randomPhone}`);
    
    // Seleccionar Administrador/a usando React Select
    try {
      // Buscar el control de React Select para Administrador/a usando el label
      const adminLabel = page.getByText('Administrador/a', { exact: false });
      await adminLabel.waitFor({ state: 'visible', timeout: 5000 });
      
      // Buscar el control de React Select cerca del label
      const adminControl = adminLabel.locator('..').locator('.react-select__control').first();
      await adminControl.waitFor({ state: 'visible', timeout: 5000 });
      await adminControl.click();
      await page.waitForTimeout(500);
      
      // Buscar el input dentro del control
      const adminInput = adminControl.locator('input').or(page.getByRole('textbox', { name: 'Administrador/a' })).first();
      await adminInput.waitFor({ state: 'visible', timeout: 3000 });
      await adminInput.fill('qa');
      await page.waitForTimeout(1000);
      
      // Seleccionar la primera opción disponible (aleatoria)
      await adminInput.press('ArrowDown');
      await page.waitForTimeout(500);
      await adminInput.press('Enter');
      await page.waitForTimeout(1000);
      console.log('✅ Administrador seleccionado');
    } catch (e) {
      console.log(`⚠️ No se pudo seleccionar administrador: ${e}, continuando...`);
    }
    

    // Seleccionar una empresa aleatoria adicional usando el patrón del record
    try {
      // Hacer click en el SVG del dropdown de empresas (basado en el record)
      await page.getByRole('tabpanel', { name: 'Datos básicos' }).locator('svg').nth(3).click();
      await page.waitForTimeout(800);
      
      // Esperar a que aparezcan las opciones del dropdown
      await page.waitForSelector('.react-select__option', { timeout: 3000 });
      await page.waitForTimeout(500);
      
      // Obtener todas las opciones disponibles del dropdown
      const companyOptions = page.locator('.react-select__option');
      const optionsCount = await companyOptions.count();
      
      if (optionsCount > 0) {
        // Seleccionar una opción aleatoria de la lista
        const randomIndex = Math.floor(Math.random() * optionsCount);
        await companyOptions.nth(randomIndex).click();
        await page.waitForTimeout(1000);
        console.log(`✅ Empresa adicional seleccionada (índice ${randomIndex})`);
      } else {
        console.log('⚠️ No se encontraron opciones de empresas disponibles');
      }
    } catch (e) {
      console.log(`⚠️ No se pudo seleccionar empresa adicional: ${e}, continuando...`);
    }


    // Guardar los cambios
    await page.getByRole('button', { name: 'Editar datos básicos' }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'OK' }).click();
    await page.waitForTimeout(1000);
  } catch (error) {
    console.log('❌ Test falló. Pausando para debug...');
    await page.pause();
    throw error;
  }
});