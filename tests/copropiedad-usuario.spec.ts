import { test, expect } from '@playwright/test';

test('Desactivar y reactivar copropiedades de usuarios', async ({ page }) => {
  // Navegar al login
  await page.goto('https://alex.queo.dev/login');
  
  // Iniciar sesión
  await page.getByRole('textbox', { name: 'Correo electrónico' }).click();
  await page.getByRole('textbox', { name: 'Correo electrónico' }).fill('automatetest@yopmail.com');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('123456a');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  
  // Buscar usuario por documento
  await page.getByRole('textbox', { name: 'Buscar por nombre, apellido,' }).click();
  await page.getByRole('textbox', { name: 'Buscar por nombre, apellido,' }).fill('395844565');
  
  // Desactivar copropiedad
  await page.getByRole('button', { name: 'menu' }).click();
  await page.getByRole('button', { name: 'Desactivar Copropiedad' }).click();
  await page.getByTestId('toggle-notify_user').click();
  await page.getByRole('button', { name: 'Desactivar' }).click();
  
  // Verificar mensaje de desactivación
  await page.getByText('Eliminación de copropiedades del usuarioSe eliminaron las copropiedades del').nth(1).click();
  
  // Buscar usuario nuevamente para reactivar
  await page.getByRole('textbox', { name: 'Buscar por nombre, apellido,' }).click();
  await page.getByRole('textbox', { name: 'Buscar por nombre, apellido,' }).fill('395844565');
  
  // Reactivar copropiedad
  await page.getByRole('button', { name: 'menu' }).click();
  await page.getByRole('button', { name: 'Restaurar' }).click();
  await page.locator('div').filter({ hasText: /^Copropiedad$/ }).click();
  await page.locator('[id="headlessui-dialog-:r0:"]').getByText('Copropiedades', { exact: true }).click();
  await page.getByText('Queo Q&A (Staging)', { exact: true }).click();
  await page.getByRole('button', { name: 'Restaurar' }).click();
  
  // Verificar mensaje de restauración
  await page.getByText('Restauración de copropiedades').nth(1).click();
  await page.getByRole('button', { name: 'Cerrar' }).click();
});
