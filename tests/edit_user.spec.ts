import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = process.env.BASE_URL || 'https://alex.queo.dev';

// slowMo se configura automáticamente desde playwright.config.ts
// cuando se ejecuta con la variable de entorno SLOW_MO

test('Editar usuario', async ({ page }) => {
  try {
    // ========== VISTA 1: LOGIN ==========
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Validar elementos del login
    await expect(page.getByRole('textbox', { name: 'Correo electrónico' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();
    
    // Login
    await page.getByRole('textbox', { name: 'Correo electrónico' }).fill('usuarior15@simultaneo.com');
    await page.getByRole('textbox', { name: 'Contraseña' }).fill('usuarior15');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    
    // ========== VISTA 2: DASHBOARD ==========
    try {
      // Esperar a que cargue la página del dashboard
      await expect(page).toHaveURL(/.*work-areas\/dashboard.*/, { timeout: 10000 });
      
      // Validar que el dashboard cargó correctamente
      await expect(page.getByRole('button', { name: 'Control de acceso' })).toBeVisible();
    } catch (error) {
      console.log('❌ Error en VISTA 2: DASHBOARD. Pausando para debug...');
      await page.pause();
      throw error;
    }
    
    // ========== VISTA 3: NAVEGAR A USUARIOS ==========
    try {
      // Si "Control de acceso" está en un menú colapsable o sidebar
      // Primero esperar a que el menú/sidebar esté visible
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle');
      
      // Buscar el botón con diferentes estrategias
      let controlAccesoButton;
      
      // Intentar por rol primero
      controlAccesoButton = page.getByRole('button', { name: 'Control de acceso' });
      await expect(controlAccesoButton).toBeVisible({ timeout: 10000 });
      
      // Si el botón está dentro de un contenedor específico, puedes usar:
      // controlAccesoButton = page.locator('[data-testid="control-acceso"]');
      // o
      // controlAccesoButton = page.locator('button:has-text("Control de acceso")');
      
      // Hacer scroll si es necesario
      await controlAccesoButton.scrollIntoViewIfNeeded();
      
      // Esperar a que el botón esté estable (sin animaciones)
      await page.waitForTimeout(300);
      
      // Hacer click
      await controlAccesoButton.click();
      
      // Esperar a que aparezca el menú y seleccionar "Usuarios"
      await expect(page.getByRole('link', { name: 'Usuarios' })).toBeVisible({ timeout: 10000 });
      await page.getByRole('link', { name: 'Usuarios' }).click();
    } catch (error) {
      console.log('❌ Error en VISTA 3: NAVEGAR A USUARIOS. Pausando para debug...');
      await page.pause();
      throw error;
    }
    
    // ========== VISTA 4: LISTA DE USUARIOS ==========
    try {
      // Esperar a que cargue la página de usuarios
      await expect(page).toHaveURL(/.*users.*/, { timeout: 10000 });
      
      // Validar que la vista de usuarios cargó
      await expect(page.getByRole('textbox', { name: /Buscar/i })).toBeVisible();
      
      // Filtrar el usuario por correo
      const searchInput = page.getByRole('textbox', { name: /Buscar/i });
      await searchInput.click();
      await searchInput.fill('usuario12@setfacial.com');
      
      // Esperar a que se filtre la lista (dar tiempo para que aparezca el usuario)
      await page.waitForTimeout(1000);
    } catch (error) {
      console.log('❌ Error en VISTA 4: LISTA DE USUARIOS. Pausando para debug...');
      await page.pause();
      throw error;
    }
    
    // ========== VISTA 5: MENÚ Y EDICIÓN ==========
    try {
      // Seleccionar los tres puntitos (menú) del usuario filtrado
      const menuButton = page.getByRole('button', { name: 'menu' }).first();
      await expect(menuButton).toBeVisible({ timeout: 5000 });
      await menuButton.click();
      
      // Esperar a que aparezca el menú y seleccionar "Editar"
      await expect(page.getByRole('link', { name: 'Editar' })).toBeVisible({ timeout: 3000 });
      await page.getByRole('link', { name: 'Editar' }).click();
    } catch (error) {
      console.log('❌ Error en VISTA 5: MENÚ Y EDICIÓN. Pausando para debug...');
      await page.pause();
      throw error;
    }
    
    // ========== VISTA 6: FORMULARIO DE EDICIÓN ==========
    try {
      // Validar elementos críticos del formulario
      await expect(page.getByTestId('input-last_name')).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole('button', { name: 'Editar Usuario' })).toBeVisible();
      
      // Editar campos: Apellido, Teléfono celular y Comentario
      // Usar valores distintivos para verificar que los cambios se aplicaron correctamente
      
      // 1. Modificar Apellido - Valor distintivo
      await page.getByTestId('input-last_name').fill('EDITADO_QA_AUTOMATIZACION');
      
      // 2. Modificar Teléfono celular - Valor distintivo
      await page.getByTestId('input-phone').fill('9998887776');
      
      // 3. Modificar Comentario - Valor distintivo
      const commentInput = page.getByTestId('input-comment');
      await expect(commentInput).toBeVisible({ timeout: 3000 });
      await commentInput.clear();
      await commentInput.fill('EDITADO_POR_TEST_AUTOMATIZADO_PLAYWRIGHT');
      
      // Guardar cambios
      await page.getByRole('button', { name: 'Editar Usuario' }).click();
    } catch (error) {
      console.log('❌ Error en VISTA 6: FORMULARIO DE EDICIÓN. Pausando para debug...');
      await page.pause();
      throw error;
    }
    
    // ========== VISTA 7: MODAL DE CONFIRMACIÓN ==========
    try {
      // Esperar a que aparezca el modal de confirmación
      await expect(page.getByRole('button', { name: 'Cerrar' })).toBeVisible({ timeout: 5000 });
      
      // Cerrar el modal
      await page.getByRole('button', { name: 'Cerrar' }).click();
      
      // Validar que el modal se cerró
      await expect(page.getByRole('button', { name: 'Cerrar' })).not.toBeVisible({ timeout: 3000 });
    } catch (error) {
      console.log('❌ Error en VISTA 7: MODAL DE CONFIRMACIÓN. Pausando para debug...');
      await page.pause();
      throw error;
    }
    
  } catch (error) {
    // Catch general por si algo falla fuera de los try-catch específicos
    console.log('❌ Test falló en un paso no cubierto. Pausando para debug...');
    await page.pause();
    throw error;
  }
});