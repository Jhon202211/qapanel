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
- **Ejecutar Login QueoAccess**: Ejecuta la prueba de login en QueoAccess
- **Ejecutar Example**: Ejecuta las pruebas de ejemplo de Playwright
- **Ejecutar Demo Todo**: Ejecuta la aplicación demo de Todo
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

### Pruebas
```bash
# Ejecutar prueba específica
npx playwright test tests/login_queo.spec.ts --headed

# Ejecutar todas las pruebas
npx playwright test --headed

# Ejecutar con UI
npx playwright test --ui
```

### Codegen (Record & Playback)
```bash
# Grabar en QueoAccess
npx playwright codegen https://queoaccess.com/login

# Grabar en Firefox
npx playwright codegen -b firefox https://queoaccess.com/login

# Grabar URL personalizada
npx playwright codegen
```

### Utilidades
```bash
# Ver reporte
npx playwright show-report

# Instalar navegadores
npx playwright install
```

## 📁 Estructura del Proyecto

```
playright/
├── playwright-panel.html    # Panel de control web
├── server.js               # Servidor Node.js
├── package.json            # Dependencias y scripts
├── playwright.config.ts    # Configuración de Playwright
├── tests/                  # Pruebas automatizadas
│   ├── login_queo.spec.ts # Prueba de login en QueoAccess
│   └── example.spec.ts    # Pruebas de ejemplo
└── tests-examples/         # Pruebas demo
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
Actualmente solo Chromium y Firefox están habilitados. WebKit está deshabilitado temporalmente.

### Error de WebKit
Si quieres habilitar WebKit nuevamente, instala las dependencias faltantes:
```bash
sudo apt update
sudo apt install libicu-dev libjpeg-dev libwebp-dev libffi-dev
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
```bash
npm run dev
```

### Ver logs del servidor
```bash
npm start
```

## 📱 Compatibilidad

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ⚠️ Safari (WebKit) - Deshabilitado temporalmente por dependencias del sistema
- ✅ Móviles y tablets
- ✅ Navegadores modernos

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
