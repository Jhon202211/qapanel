# 🚀 Guía Paso a Paso: Desplegar en Cloudflare Pages

## 📋 Pre-requisitos

- ✅ Cuenta en [Cloudflare](https://dash.cloudflare.com/) (gratuita)
- ✅ Repositorio en GitHub (`Jhon202211/qapanel` o `queodevteam/playwright`)
- ✅ Código subido al repositorio

---

## 🎯 Opción Recomendada: Panel Estático en Cloudflare Pages

### Paso 1: Acceder a Cloudflare Dashboard

1. Ve a [https://dash.cloudflare.com/](https://dash.cloudflare.com/)
2. Inicia sesión con tu cuenta
3. En el menú lateral, haz clic en **"Pages"**

### Paso 2: Crear Nuevo Proyecto

1. Haz clic en el botón **"Create a project"**
2. Selecciona **"Connect to Git"**
3. Autoriza Cloudflare Pages a acceder a tu cuenta de GitHub
4. Selecciona el repositorio: `Jhon202211/qapanel` o `queodevteam/playwright`
5. Haz clic en **"Begin setup"**

### Paso 3: Configurar Build Settings

En la pantalla de configuración, usa estos valores:

```
Framework preset: None
Build command: (déjalo vacío o usa: echo "No build required")
Build output directory: /
Root directory: /
```

**Explicación:**
- **Framework preset**: `None` porque es un sitio estático HTML
- **Build command**: No necesitamos compilar nada
- **Build output directory**: `/` (raíz del proyecto)
- **Root directory**: `/` (raíz del proyecto)

### Paso 4: Configurar Variables de Entorno (Opcional)

Si necesitas variables de entorno:

1. Haz clic en **"Environment variables (advanced)"**
2. Agrega las variables necesarias:
   - `NODE_ENV` = `production`
   - `BASE_URL` = `https://alex.queo.dev` (o tu URL)
   - **`RUNNER_URL`** = URL de tu runner en Railway (ej. `https://playwright-runner-production-8434.up.railway.app`)  
     → **Necesaria para que el panel en Cloudflare ejecute y liste tests** usando el backend desplegado en Railway. Sin esta variable, el panel mostrará el mensaje de "servicio externo requerido".
   - Cualquier otra variable que uses en tu código

### Paso 5: Desplegar

1. Haz clic en **"Save and Deploy"**
2. Cloudflare comenzará a construir y desplegar tu proyecto
3. Espera 1-2 minutos mientras se completa el despliegue
4. Una vez completado, verás una URL como: `https://playwright-panel-xxxxx.pages.dev`

### Paso 6: Configurar Dominio Personalizado (Opcional)

1. En la página del proyecto, ve a **"Custom domains"**
2. Haz clic en **"Set up a custom domain"**
3. Ingresa tu dominio (ej: `playwright.queo.dev`)
4. Sigue las instrucciones para configurar DNS

---

## ⚠️ Limitaciones Importantes

### ❌ Lo que NO funcionará en Cloudflare Pages:

- **Ejecutar tests de Playwright**: No hay acceso al sistema de archivos ni a procesos hijos
- **Codegen**: Requiere ejecutar comandos del sistema
- **Leer/Escribir archivos de tests**: No hay acceso al sistema de archivos
- **Ejecutar comandos del servidor**: No se pueden ejecutar `exec` o `spawn`

### ✅ Lo que SÍ funcionará:

- **Panel HTML**: Se mostrará correctamente
- **Interfaz de usuario**: Todos los elementos visuales funcionarán
- **APIs básicas**: Las funciones en `functions/api/` responderán (con limitaciones)

---

## 🔄 Alternativa: Desplegar Servidor Completo

Si necesitas **TODAS** las funcionalidades (ejecutar tests, codegen, etc.), despliega el servidor Express en:

### Railway (Recomendado - Gratis con límites)

1. Ve a [https://railway.app/](https://railway.app/)
2. Inicia sesión con GitHub
3. Haz clic en **"New Project"** → **"Deploy from GitHub repo"**
4. Selecciona tu repositorio
5. Railway detectará automáticamente `package.json` y `server.js`
6. Configura variables de entorno si es necesario
7. El servidor se desplegará automáticamente
8. Obtendrás una URL como: `https://playwright-panel.up.railway.app`

### Render (Alternativa)

1. Ve a [https://render.com/](https://render.com/)
2. Inicia sesión con GitHub
3. Haz clic en **"New"** → **"Web Service"**
4. Conecta tu repositorio
5. Configura:
   - **Name**: `playwright-panel`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Agrega variables de entorno
7. Haz clic en **"Create Web Service"**

---

## 🔗 Configuración Híbrida (Recomendada para Producción)

### Conectar el panel (Cloudflare) con el runner (Railway)

1. Despliega el **playwright-runner** en Railway y anota la URL (ej. `https://playwright-runner-production-8434.up.railway.app`).
2. En tu proyecto en **Cloudflare Pages**:
   - Ve a **Settings** → **Environment variables**.
   - Añade una variable:
     - **Variable name:** `RUNNER_URL`
     - **Value:** `https://tu-app.up.railway.app` (tu URL de Railway, **sin** barra final).
   - Guarda y haz un **nuevo despliegue** (Redeploy) para que la variable se aplique.
3. El panel seguirá llamando a `/api/list-tests` y `/api/run-command`; la función en `functions/api/` hará de proxy al runner usando `RUNNER_URL`.

### Arquitectura:

```
┌─────────────────────────┐
│  Cloudflare Pages       │
│  (Panel HTML estático)  │
│  playwright-panel.html   │
│  + functions/api (proxy)│
└───────────┬─────────────┘
            │
            │ RUNNER_URL
            │
┌───────────▼─────────────┐
│  Railway (playwright-   │
│  runner)                │
│  GET /tests, POST /run  │
│  - Listar tests         │
│  - Ejecutar tests       │
└─────────────────────────┘
```

### Pasos:

1. **Despliega el panel en Cloudflare Pages** (sigue los pasos 1-6 arriba)
2. **Despliega el servidor en Railway/Render** (sigue las instrucciones de Railway/Render)
3. **Modifica `playwright-panel.html`** para apuntar al servidor externo:

```javascript
// Busca en playwright-panel.html la línea donde se hacen las peticiones API
// Cambia de:
const API_BASE = ''; // o '/api'

// A:
const API_BASE = 'https://tu-servidor-railway.up.railway.app';
```

---

## 📁 Archivos Creados para Cloudflare

Se han creado los siguientes archivos:

- ✅ `wrangler.toml` - Configuración de Cloudflare Workers/Pages
- ✅ `functions/api/[[path]].ts` - Funciones serverless (con limitaciones)
- ✅ `_redirects` - Reglas de redirección para APIs
- ✅ `cloudflare-pages.json` - Configuración alternativa
- ✅ `index.html` - Redirección al panel principal
- ✅ `DEPLOY.md` - Documentación técnica detallada

---

## 🧪 Probar el Despliegue

1. Una vez desplegado, visita la URL de Cloudflare Pages
2. Deberías ver el panel de Playwright
3. Las funciones básicas (como `/api/status`) deberían responder
4. Las funciones que requieren ejecutar comandos mostrarán mensajes de error explicativos

---

## 🆘 Solución de Problemas

### Error: "Build failed"
- Verifica que el repositorio esté correctamente conectado
- Asegúrate de que `playwright-panel.html` esté en la raíz del proyecto

### Error: "404 Not Found"
- Verifica que `index.html` o `playwright-panel.html` existan
- Revisa la configuración de "Build output directory"

### APIs no funcionan
- Esto es esperado: Cloudflare Workers no puede ejecutar Playwright
- Considera usar la opción híbrida (Cloudflare + Railway/Render)

---

## 📞 Próximos Pasos

1. ✅ Despliega en Cloudflare Pages siguiendo los pasos 1-6
2. 🔄 Si necesitas funcionalidad completa, despliega también en Railway/Render
3. 🔗 Configura la arquitectura híbrida si es necesario
4. 🎨 Personaliza el dominio y la configuración según tus necesidades

---

## 💡 Recomendación Final

Para **desarrollo y pruebas locales**: Sigue usando `npm start` (servidor Express local)

Para **producción con funcionalidad completa**: Usa la arquitectura híbrida (Cloudflare Pages + Railway/Render)

Para **solo mostrar el panel UI**: Cloudflare Pages es suficiente

