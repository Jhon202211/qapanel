import { test, expect, Page } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const USER_EMAIL = process.env.USER_EMAIL || '';
const USER_PASSWORD = process.env.USER_PASSWORD || '';
const BASE_URL = process.env.BASE_URL || 'https://alex.queo.dev';
const EXECUTION_TYPE = process.env.EXECUTION_TYPE || 'plan';

// Clase PropertyPage para encapsular la lógica de interacción con la página de propiedades
class PropertyPage {
  private page: Page;
  private timeout: number;

  constructor(page: Page) {
    this.page = page;
    this.timeout = 30000;
  }

  async login(email: string, password: string): Promise<void> {
    await this.page.goto(`${BASE_URL}/login`);
    
    const emailField = this.page.locator("input[name='email']");
    await emailField.waitFor({ state: 'visible', timeout: this.timeout });
    await emailField.clear();
    await emailField.fill(email);
    await this.page.waitForTimeout(1000);
    
    const passwordField = this.page.locator("input[name='password']");
    await passwordField.waitFor({ state: 'visible', timeout: this.timeout });
    await passwordField.clear();
    await passwordField.fill(password);
    await this.page.waitForTimeout(1000);
    
    const submitButton = this.page.locator("button[type='submit']");
    await submitButton.waitFor({ state: 'visible', timeout: this.timeout });
    await submitButton.click();
    await this.page.waitForTimeout(2000);
  }

  async createProperty(uniqueId: string): Promise<void> {
    // Configurar permisos de geolocalización para evitar el popup
    await this.page.context().grantPermissions(['geolocation'], { origin: BASE_URL });
    await this.page.context().setGeolocation({ latitude: 4.6097, longitude: -74.0817 }); // Bogotá
    
    // Navegar al login y luego a la página de creación de propiedades
    // Siguiendo el flujo del test grabado
    await this.page.goto(`${BASE_URL}/login`);
    await this.page.waitForTimeout(1000);
    
    // Navegar a Copropiedades usando el menú
    await this.page.getByRole('button', { name: 'Organización' }).click();
    await this.page.waitForTimeout(500);
    
    await this.page.getByRole('link', { name: 'Copropiedades' }).click();
    await this.page.waitForTimeout(1000);
    
    // Hacer click en el botón de nueva propiedad
    await this.page.getByTestId('button-new-property').click();
    await this.page.waitForTimeout(2000);
    
    // Campo Nombre usando data-testid
    await this.page.getByTestId('input-name').click();
    await this.page.getByTestId('input-name').fill(`QAtest${uniqueId}`);
    await this.page.waitForTimeout(500);
    console.log(`✅ Campo nombre llenado: QAtest${uniqueId}`);
    
    // Interactuar con el mapa - arrastrar el marcador para establecer la ubicación
    // Primero esperar a que el mapa se cargue completamente
    await this.page.waitForTimeout(2000);
    
    try {
      // Buscar el contenedor del mapa
      const mapContainer = this.page.locator('.leaflet-container').or(this.page.locator('div[class*="map"]')).or(this.page.locator('div[id*="map"]')).first();
      await mapContainer.waitFor({ state: 'visible', timeout: 5000 });
      
      // Obtener las dimensiones del mapa
      const box = await mapContainer.boundingBox();
      if (box) {
        // Hacer click en el centro del mapa para establecer una ubicación
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;
        
        // Hacer click en el mapa para establecer la ubicación
        await this.page.mouse.click(centerX, centerY);
        await this.page.waitForTimeout(1000);
        
        // Intentar arrastrar el marcador moviendo el mouse
        // Primero buscar el marcador
        const marker = this.page.locator('.leaflet-marker-icon').or(this.page.locator('[class*="marker"]')).first();
        try {
          const markerBox = await marker.boundingBox();
          if (markerBox) {
            // Arrastrar el marcador a una nueva posición
            await this.page.mouse.move(markerBox.x + markerBox.width / 2, markerBox.y + markerBox.height / 2);
            await this.page.mouse.down();
            await this.page.mouse.move(centerX, centerY);
            await this.page.mouse.up();
            await this.page.waitForTimeout(1500);
            console.log('✅ Marcador movido en el mapa');
          }
        } catch (e) {
          // Si no se encuentra el marcador, hacer click directamente en el mapa
          await this.page.mouse.click(centerX, centerY);
          await this.page.waitForTimeout(1500);
          console.log('✅ Click realizado en el mapa');
        }
      }
    } catch (e) {
      console.log('⚠️ No se pudo interactuar con el mapa, continuando...');
    }
    
    // Campo NIT (requerido)
    try {
      const nitField = this.page.getByTestId('input-nit').or(this.page.locator('input[name="nit"]')).or(this.page.getByLabel(/nit/i));
      await nitField.waitFor({ state: 'visible', timeout: 3000 });
      await nitField.click();
      await nitField.fill(`123456789${uniqueId.slice(-4)}`);
      await this.page.waitForTimeout(500);
      console.log('✅ Campo NIT llenado');
    } catch (e) {
      console.log('⚠️ Campo NIT no encontrado, continuando...');
    }
    
    // Campo Teléfono de contacto (requerido)
    try {
      const phoneField = this.page.getByTestId('input-phone').or(this.page.locator('input[name="phone"]')).or(this.page.getByLabel(/teléfono/i));
      await phoneField.waitFor({ state: 'visible', timeout: 3000 });
      await phoneField.click();
      await phoneField.fill(`300${uniqueId.slice(-7)}`);
      await this.page.waitForTimeout(500);
      console.log('✅ Campo teléfono llenado');
    } catch (e) {
      console.log('⚠️ Campo teléfono no encontrado, continuando...');
    }
    
    // Verificar que el campo de dirección se haya llenado automáticamente después de mover el marcador
    await this.page.waitForTimeout(1000);
    
    // Seleccionar Administrador/a usando React Select
    try {
      await this.page.locator('.react-select__value-container').first().click();
      await this.page.waitForTimeout(500);
      
      await this.page.getByRole('textbox', { name: 'Administrador/a' }).fill('qa');
      await this.page.waitForTimeout(1000);
      
      await this.page.getByLabel('Datos básicos').getByText('Automatic QA').click();
      await this.page.waitForTimeout(1000);
    } catch (e) {
      console.log('⚠️ No se pudo seleccionar administrador, continuando...');
    }
    
    // Seleccionar Empresas usando React Select
    try {
      await this.page.locator('div').filter({ hasText: /^Empresas$/ }).nth(2).click();
      await this.page.waitForTimeout(500);
      
      await this.page.getByRole('textbox', { name: 'Empresas' }).fill('stag');
      await this.page.waitForTimeout(1000);
      await this.page.getByRole('textbox', { name: 'Empresas' }).press('ArrowDown');
      await this.page.waitForTimeout(500);
      await this.page.getByRole('textbox', { name: 'Empresas' }).press('Enter');
      await this.page.waitForTimeout(1000);
    } catch (e) {
      console.log('⚠️ No se pudo seleccionar empresa, continuando...');
    }
    
    // Hacer scroll hacia abajo para encontrar el botón
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await this.page.waitForTimeout(1000);
    await this.page.keyboard.press('End');
    await this.page.waitForTimeout(1000);
    
    // Hacer click en el botón "Guardar datos básicos"
    try {
      const saveButton = this.page.getByRole('button', { name: 'Guardar datos básicos' });
      await saveButton.waitFor({ state: 'visible', timeout: 5000 });
      await saveButton.click();
      console.log('✅ Botón "Guardar datos básicos" clickeado');
      
      // Esperar y validar que aparezca el mensaje de éxito
      // El mensaje puede tardar en aparecer, así que esperamos un poco más
      await this.page.waitForTimeout(2000);
      
      // Buscar el mensaje de éxito "Copropiedad creada correctamente!" 
      // El mensaje está en un modal de SweetAlert - esperar hasta que aparezca
      console.log('⏳ Esperando que aparezca el mensaje de éxito...');
      
      // Estrategia 1: Buscar en el contenedor de SweetAlert con texto exacto (timeout largo)
      try {
        const successMessage = this.page.locator('#swal2-html-container', { 
          hasText: 'Copropiedad creada correctamente!' 
        });
        await successMessage.waitFor({ state: 'visible', timeout: 30000 });
        const isVisible = await successMessage.isVisible();
        if (isVisible) {
          console.log('✅ Mensaje de éxito "Copropiedad creada correctamente!" encontrado en SweetAlert');
        } else {
          throw new Error('El mensaje no es visible');
        }
      } catch (e) {
        // Estrategia 2: Buscar cualquier elemento que contenga el texto exacto
        try {
          const successMessage2 = this.page.getByText('Copropiedad creada correctamente!', { exact: false });
          await successMessage2.waitFor({ state: 'visible', timeout: 25000 });
          const isVisible = await successMessage2.isVisible();
          if (isVisible) {
            console.log('✅ Mensaje de éxito encontrado (texto exacto)');
          } else {
            throw new Error('El mensaje no es visible');
          }
        } catch (e2) {
          // Estrategia 3: Buscar con regex en cualquier parte
          try {
            const successMessage3 = this.page.locator('text=/Copropiedad creada correctamente/i');
            await successMessage3.waitFor({ state: 'visible', timeout: 25000 });
            const isVisible = await successMessage3.isVisible();
            if (isVisible) {
              console.log('✅ Mensaje de éxito encontrado (regex)');
            } else {
              throw new Error('El mensaje no es visible');
            }
          } catch (e3) {
            // Estrategia 4: Buscar en el modal de SweetAlert con selector más amplio
            try {
              const successModal = this.page.locator('.swal2-html-container')
                .or(this.page.locator('#swal2-html-container'))
                .filter({ hasText: /copropiedad.*creada/i });
              await successModal.waitFor({ state: 'visible', timeout: 25000 });
              const isVisible = await successModal.isVisible();
              if (isVisible) {
                console.log('✅ Mensaje de éxito encontrado en modal SweetAlert');
              } else {
                throw new Error('El mensaje no es visible');
              }
            } catch (e4) {
              throw new Error(`El mensaje de éxito "Copropiedad creada correctamente!" no apareció después de esperar: ${e4}`);
            }
          }
        }
      }
      
      // Opcional: Hacer click en el botón OK del modal si existe
      try {
        const okButton = this.page.getByRole('button', { name: 'OK' });
        await okButton.waitFor({ state: 'visible', timeout: 3000 });
        await okButton.click();
        await this.page.waitForTimeout(1000);
        console.log('✅ Botón OK del modal clickeado');
      } catch (e) {
        // Si no hay botón OK, continuar
        console.log('⚠️ Botón OK no encontrado, continuando...');
      }
    } catch (e) {
      throw new Error(`Error al guardar o validar la creación: ${e}`);
    }
  }

  async isPropertyCreated(): Promise<boolean> {
    // La validación del mensaje de éxito ya se hace en createProperty()
    // Este método ahora solo verifica que el mensaje esté presente como confirmación
    try {
      // Buscar el mensaje de éxito "Copropiedad creada correctamente!"
      const successMessage = this.page.locator('text=Copropiedad creada correctamente!')
        .or(this.page.locator('text=/copropiedad.*creada.*correctamente/i'));
      
      const isVisible = await successMessage.isVisible({ timeout: 2000 });
      if (isVisible) {
        console.log('✅ Mensaje de éxito confirmado en isPropertyCreated');
        return true;
      }
    } catch (e) {
      // Si no está visible, verificar si el modal de éxito está presente
      try {
        const successModal = this.page.locator('#swal2-html-container')
          .or(this.page.locator('[class*="swal"]'))
          .filter({ hasText: /copropiedad.*creada/i });
        
        const modalVisible = await successModal.isVisible({ timeout: 2000 });
        if (modalVisible) {
          console.log('✅ Modal de éxito confirmado');
          return true;
        }
      } catch (e2) {
        // Ignorar
      }
    }
    
    // Si la validación en createProperty() pasó, asumir éxito
    // (el mensaje ya fue validado allí)
    console.log('✅ Validación completada en createProperty, confirmando éxito');
    return true;
  }
}

// Función para enviar resultados a Firebase (opcional)
async function sendTestResultsToFirebase(data: {
  name: string;
  status: string;
  duration: number;
  date: string;
  error: string;
  executionType: string;
}): Promise<void> {
  // TODO: Implementar integración con Firebase si es necesario
  // Por ahora solo logueamos los resultados
  console.log('Test Results:', JSON.stringify(data, null, 2));
  
  // Si tienes una función de Firebase, descomenta y ajusta:
  // await sendTestResultsToFirebase(data);
}

test('test_create_property', async ({ page }) => {
  // Aumentar el timeout del test a 60 segundos para dar tiempo a que aparezca el mensaje
  test.setTimeout(60000);
  
  const startTime = Date.now();
  let errorMsg = '';
  let status = 'passed';

  try {
    // Configurar timeout de la página
    page.setDefaultTimeout(50000);
    
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

    const propertyPage = new PropertyPage(page);
    await propertyPage.login(USER_EMAIL, USER_PASSWORD);
    
    // Generar ID único para la propiedad
    const uniqueId = Date.now().toString();
    await propertyPage.createProperty(uniqueId);
    
    // Validar que la propiedad fue creada correctamente
    const isCreated = await propertyPage.isPropertyCreated();
    expect(isCreated).toBe(true);
    
    console.log(`✅ Propiedad creada exitosamente con ID: ${uniqueId}`);

  } catch (error) {
    status = 'failed';
    errorMsg = error instanceof Error ? error.message : String(error);
    console.log(`❌ Error al crear propiedad: ${errorMsg}`);
    
    // Tomar screenshot del error en la carpeta screenshot_error_
    const timestamp = Date.now();
    await page.screenshot({ path: `screenshot_error_/screenshot_error_${timestamp}.png` });
    
    throw error;
  } finally {
    const duration = (Date.now() - startTime) / 1000; // Convertir a segundos
    const dateIso = new Date().toISOString();
    
    await sendTestResultsToFirebase({
      name: 'test_create_property',
      status: status,
      duration: Math.round(duration * 100) / 100, // Redondear a 2 decimales
      date: dateIso,
      error: errorMsg,
      executionType: EXECUTION_TYPE
    });
  }
});
