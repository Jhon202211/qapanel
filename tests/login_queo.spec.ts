import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://alex.queo.dev/login');
  await page.goto('https://yanine.queo.dev/login');
  await page.getByRole('textbox', { name: 'Correo electrónico' }).click();
  await page.getByRole('textbox', { name: 'Correo electrónico' }).click();
  await page.getByRole('textbox', { name: 'Correo electrónico' }).fill('userrfid2109@refactor.com');
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('userrfid2109');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.goto('https://yanine.queo.dev/work-areas?searchType=search&');
});