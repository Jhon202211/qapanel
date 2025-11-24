import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
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
  
  await page.goto('https://alex.queo.dev/login');
  await page.getByRole('textbox', { name: 'Correo electrónico' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('textbox', { name: 'Correo electrónico' }).click();
  await page.getByRole('textbox', { name: 'Correo electrónico' }).fill('alexander@queo.com.co');
  await page.getByRole('textbox', { name: 'Correo electrónico' }).press('Tab');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('123456a');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.goto('https://alex.queo.dev/work-areas?searchType=search&');
  await page.getByRole('link', { name: 'Jhon Alexander Betancur' }).click();
  await page.getByRole('button', { name: ' Salir' }).click();
});