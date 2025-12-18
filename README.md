# 🎭 Panel de Control Playwright

Un panel de control web moderno y elegante para gestionar tus pruebas automatizadas de Playwright de manera sencilla e intuitiva.

## ✨ Características

- 🧪 **Ejecutar Pruebas**: Botones para ejecutar pruebas individuales o todas juntas
- 🎬 **Record & Playback**: Iniciar sesiones de grabación con Codegen
- 🛠️ **Utilidades**: Ver reportes, instalar navegadores, limpiar salida
- 📱 **Responsive**: Diseño adaptativo para móviles y escritorio
- 🎨 **UI Moderna**: Interfaz con gradientes y animaciones suaves
- 📊 **Salida en Tiempo Real**: Ver la ejecución de comandos en vivo

## 🚀 Instalación

### 1. Instalar dependencias
```bash
npm install
```

### 2. Instalar navegadores de Playwright
```bash
npx playwright install
```

### 3. Iniciar el panel de control
```bash
npm start
```

### 4. Abrir en el navegador
```
http://localhost:3000
```

## 🎯 Uso del Panel

### Sección de Pruebas
El panel permite ejecutar pruebas individuales o todas juntas. Las pruebas disponibles incluyen:
- **Login QueoAccess**: Prueba de autenticación en QueoAccess
- **Crear Compañía**: Prueba para crear una nueva compañía
- **Crear Propiedad**: Prueba para crear una nueva propiedad
- **Crear Reserva de Habitación**: Prueba para crear reservas
- **Crear Usuario**: Prueba para crear nuevos usuarios
- **Crear Visitante**: Prueba para crear visitantes
- **Editar Propiedad**: Prueba para editar propiedades existentes
- **Editar Usuario**: Prueba para editar usuarios existentes
- **Listar Compañías**: Prueba para listar compañías
- **Buscar Compañía**: Prueba para buscar compañías
- **Listar/Buscar Propiedades**: Prueba para listar y buscar propiedades
- **Desactivar/Activar Propiedad**: Prueba para cambiar estado de propiedades
- **Desactivar Compañía**: Prueba para desactivar compañías
- **Restaurar Usuario/Compañía**: Prueba para restaurar elementos desactivados
- **Logout**: Prueba para cerrar sesión
- **Ejecutar Todas las Pruebas**: Ejecuta todas las pruebas del proyecto

### Sección de Codegen
- **Grabar QueoAccess**: Inicia grabación en la página de login de QueoAccess
- **Grabar URL Personalizada**: Inicia grabación en una URL personalizada
- **Grabar en Firefox**: Inicia grabación específicamente en Firefox

### Sección de Utilidades
- **Ver Reporte HTML**: Abre el reporte de pruebas en el navegador
- **Instalar Navegadores**: Instala/actualiza los navegadores de Playwright
- **Limpiar Salida**: Limpia la consola de salida

## 🔧 Comandos Disponibles

### Scripts NPM
```bash
# Iniciar el panel de control
npm start

# Modo desarrollo con recarga automática (nodemon)
npm run dev

# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas con navegador visible
npm run test:headed

# Ejecutar pruebas con UI interactiva
npm run test:ui

# Abrir reporte HTML de pruebas
npm run report

# Instalar/actualizar navegadores de Playwright
npm run install-browsers

# Iniciar Codegen (grabación)
npm run codegen

# Iniciar Codegen con target específico
npm run codegen:target
```

### Comandos Playwright Directos

#### Pruebas
```bash
# Ejecutar prueba específica
npx playwright test tests/login_queo.spec.ts --headed

# Ejecutar todas las pruebas
npx playwright test --headed

# Ejecutar con UI interactiva
npx playwright test --ui

# Ejecutar prueba específica por nombre
npx playwright test tests/create_company.spec.ts
```

#### Codegen (Record & Playback)
```bash
# Grabar en QueoAccess
npx playwright codegen https://queoaccess.com/login

# Grabar en Firefox
npx playwright codegen -b firefox https://queoaccess.com/login

# Grabar URL personalizada
npx playwright codegen
```

#### Utilidades
```bash
# Ver reporte HTML
npx playwright show-report

# Instalar navegadores
npx playwright install
```

## 📁 Estructura del Proyecto

```
playwright/
├── playwright-panel.html      # Panel de control web
├── server.js                  # Servidor Node.js con APIs REST
├── package.json               # Dependencias y scripts
├── playwright.config.ts       # Configuración de Playwright
├── test-editor.css           # Estilos del editor de pruebas
├── test-editor.js            # Funcionalidad del editor de pruebas
├── test-continue-recording.js # Utilidad para continuar grabación
├── src/                      # Recursos estáticos
│   └── queosmall.svg         # Logo/icono del proyecto
├── tests/                    # Pruebas automatizadas principales
│   ├── login_queo.spec.ts
│   ├── logout.spec.ts
│   ├── create_company.spec.ts
│   ├── create_property.spec.ts
│   ├── create_room_reservation.spec.ts
│   ├── create_user.spec.ts
│   ├── create_visitor.spec.ts
│   ├── edit_property.spec.ts
│   ├── edit_user.spec.ts
│   ├── list_companies.spec.ts
│   ├── list_seach_properties.spec.ts
│   ├── search_company.spec.ts
│   ├── deactivate_company.spec.ts
│   ├── deactivate_activate_property.spec.ts
│   └── restore_user_company.spec.ts
└── tests-examples/           # Pruebas de ejemplo/demo
    └── demo-todo-app.spec.ts
```

## 🎨 Personalización

### Colores y Estilos
El panel usa CSS personalizable con variables CSS. Puedes modificar:
- Colores de fondo y gradientes
- Tipografías
- Espaciado y bordes
- Animaciones y transiciones

### Agregar Nuevos Botones
Para agregar nuevos botones:

1. **HTML**: Agregar botón en la sección correspondiente
2. **JavaScript**: Implementar función de manejo
3. **Estilos**: Aplicar clases CSS existentes

## 🚨 Solución de Problemas

### Configuración de Navegadores
Actualmente **solo Chromium está habilitado** en la configuración. Firefox y WebKit están deshabilitados temporalmente.

Para habilitar Firefox o WebKit:
1. Abre `playwright.config.ts`
2. Descomenta las secciones correspondientes en el array `projects`

### Error de WebKit
Si quieres habilitar WebKit nuevamente, instala las dependencias faltantes:
```bash
# En Linux
sudo apt update
sudo apt install libicu-dev libjpeg-dev libwebp-dev libffi-dev

# En macOS
brew install libicu libjpeg libwebp libffi
```

Luego descomenta la sección de WebKit en `playwright.config.ts`.

### Puerto en uso
Si el puerto 3000 está ocupado, modifica `PORT` en `server.js`

### Permisos de ejecución
Asegúrate de que los archivos tengan permisos de ejecución:
```bash
chmod +x server.js
```

## 🔄 Desarrollo

### Modo desarrollo con recarga automática
El proyecto incluye `nodemon` para desarrollo con recarga automática:
```bash
npm run dev
```

### Ver logs del servidor
```bash
npm start
```

### Editor de Pruebas Integrado
El panel incluye un editor de pruebas integrado que permite:
- Ver el código de las pruebas
- Editar pruebas directamente desde el navegador
- Continuar grabaciones de Codegen
- Guardar cambios en tiempo real

Los archivos `test-editor.js` y `test-editor.css` proporcionan esta funcionalidad.

## 📱 Compatibilidad

### Navegadores de Prueba
- ✅ Chrome/Edge (Chromium) - **Actualmente habilitado**
- ⚠️ Firefox - Deshabilitado en configuración (puede habilitarse)
- ⚠️ Safari (WebKit) - Deshabilitado temporalmente por dependencias del sistema

### Navegadores para el Panel Web
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ Móviles y tablets
- ✅ Navegadores modernos

## 🔌 APIs del Servidor

El servidor incluye las siguientes APIs REST:

### GET `/api/status`
Verifica el estado del servidor y Playwright.

### GET `/api/list-tests`
Lista todos los archivos de pruebas disponibles en el directorio `tests/`.

### POST `/api/read-test`
Lee el contenido de un archivo de prueba específico.
```json
{
  "filePath": "tests/login_queo.spec.ts"
}
```

### POST `/api/write-test`
Escribe/actualiza el contenido de un archivo de prueba.
```json
{
  "filePath": "tests/login_queo.spec.ts",
  "content": "// código del test..."
}
```

### POST `/api/run-command`
Ejecuta un comando de Playwright desde el panel.
```json
{
  "command": "npx playwright test tests/login_queo.spec.ts --headed"
}
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia ISC.

---

**¡Disfruta automatizando tus pruebas con Playwright! 🎭✨**
