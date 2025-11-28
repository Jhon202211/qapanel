import { test, expect } from '@playwright/test';

// slowMo se configura automáticamente desde playwright.config.ts
// cuando se ejecuta con la variable de entorno SLOW_MO

test('Cerrar sesión', async ({ page }) => {
  try {
    // ========== VISTA 1: LOGIN ==========
    await page.goto('https://yanine.queo.dev/login');
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
      // El link del usuario debería estar visible en el sidebar
      await expect(page.getByRole('link', { name: 'Usuario 15 R Simultaneo' })).toBeVisible({ timeout: 10000 });
    } catch (error) {
      console.log('❌ Error en VISTA 2: DASHBOARD. Pausando para debug...');
      await page.pause();
      throw error;
    }
    
    // ========== VISTA 3: ABRIR MENÚ DE USUARIO ==========
    try {
      // El link del usuario está en un sidebar - esperar a que la página esté completamente cargada
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle');
      
      // Esperar un momento para que el sidebar termine de renderizar
      await page.waitForTimeout(500);
      
      // Buscar el link del usuario en el sidebar
      const userLink = page.getByRole('link', { name: 'Usuario 15 R Simultaneo' });
      
      // Esperar a que el link esté visible (el sidebar puede tardar en cargar)
      await expect(userLink).toBeVisible({ timeout: 10000 });
      
      // Hacer scroll si es necesario (importante en sidebars que pueden tener scroll)
      await userLink.scrollIntoViewIfNeeded();
      
      // Esperar a que el link esté estable (sin animaciones)
      await page.waitForTimeout(300);
      
      // Hacer click
      await userLink.click();
      
      // Esperar a que aparezca el menú desplegable
      await page.waitForTimeout(300);
    } catch (error) {
      console.log('❌ Error en VISTA 3: ABRIR MENÚ DE USUARIO. Pausando para debug...');
      await page.pause();
      throw error;
    }
    
    // ========== VISTA 4: CERRAR SESIÓN ==========
    try {
      // Esperar a que aparezca el botón "Salir" en el menú
      const salirButton = page.getByRole('button', { name: /Salir/i });
      await expect(salirButton).toBeVisible({ timeout: 5000 });
      
      // Hacer click en "Salir"
      await salirButton.click();
    } catch (error) {
      console.log('❌ Error en VISTA 4: CERRAR SESIÓN. Pausando para debug...');
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