import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://yanine.queo.dev/login');
  await page.getByRole('textbox', { name: 'Correo electrónico' }).click();
  await page.getByRole('textbox', { name: 'Correo electrónico' }).fill('userrfid2109@refactor.com');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('userrfid2109');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  
  // Esperar a que cargue la página del dashboard después del login
  await expect(page).toHaveURL(/.*\/dashboard.*/, { timeout: 10000 });
  
  // Esperar a que la página esté completamente cargada antes de interactuar con el sidebar
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  
  // Esperar un momento para que el sidebar termine de renderizar
  await page.waitForTimeout(1000);
  
  // Buscar el botón "Organización" - puede estar en el sidebar
  const organizacionButton = page.getByRole('button', { name: 'Organización' });
  
  // Esperar a que el botón esté visible (el sidebar puede tardar en cargar)
  await expect(organizacionButton).toBeVisible({ timeout: 15000 });
  
  // Hacer scroll si es necesario (importante en sidebars que pueden tener scroll)
  await organizacionButton.scrollIntoViewIfNeeded();
  
  // Esperar a que el botón esté estable (sin animaciones)
  await page.waitForTimeout(500);
  
  // Hacer click
  await organizacionButton.click();
  
  // Esperar a que aparezca el menú desplegable y validar que "Empresas" esté en la lista
  await expect(page.getByRole('link', { name: 'Empresas' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('link', { name: 'Empresas' }).click();
  
  // Esperar a que cargue la vista de empresas
  await expect(page).toHaveURL(/.*companies.*/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('textbox', { name: 'Escriba el término para' })).toBeVisible({ timeout: 5000 });
  
  // Buscar empresa en el filtro
  const searchBox = page.getByRole('textbox', { name: 'Escriba el término para' });
  await searchBox.click();
  await searchBox.fill('refactor E-1');
  await searchBox.press('Enter');
  
  // Esperar a que se complete el filtrado y la tabla se renderice
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Intentar encontrar el botón del menú con diferentes selectores
  let menuButton;
  try {
    // Intentar primero con el selector estático
    menuButton = page.locator('#dropdownMenuButton').first();
    await expect(menuButton).toBeVisible({ timeout: 5000 });
  } catch (e) {
    // Si no funciona, intentar con el selector dinámico de headlessui
    menuButton = page.locator('[id*="headlessui-menu-button"]').first();
    await expect(menuButton).toBeVisible({ timeout: 10000 });
  }
  
  await menuButton.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await menuButton.click();
  
  // Seleccionar "Eliminar"
  await expect(page.getByRole('menuitem', { name: 'Eliminar' })).toBeVisible({ timeout: 5000 });
  await page.getByRole('menuitem', { name: 'Eliminar' }).click();
  
  // Confirmar la eliminación
  await expect(page.getByTestId('undefined-confirmation-modal-confirm-button')).toBeVisible({ timeout: 5000 });
  await page.getByTestId('undefined-confirmation-modal-confirm-button').click();
});