import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://yanine.queo.dev/login');
  await page.getByRole('textbox', { name: 'Correo electrónico' }).click();
  await page.getByRole('textbox', { name: 'Correo electrónico' }).fill('usuarior15@simultaneo.com');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('usuarior15');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('button', { name: 'Control de acceso' }).click();
  await page.getByRole('link', { name: 'Usuarios' }).click();
  await page.locator('#menu-396643').click();
  await page.getByRole('link', { name: 'Editar' }).click();
  await page.getByTestId('input-last_name').click();
  await page.getByTestId('input-last_name').fill('R Simultaneo edit');
  await page.getByRole('button', { name: 'Editar Usuario' }).click();
  await page.getByRole('button', { name: 'Cerrar' }).click();
});