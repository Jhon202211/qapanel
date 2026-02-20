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

**Si el panel sigue diciendo "No se pudo conectar al runner"** aunque el runner responda en el navegador:

- **wrangler.toml manda:** Si en Cloudflare ves el aviso *"Environment variables are being managed through wrangler.toml. Only Secrets can be managed via the Dashboard"*, entonces **las variables/Secrets del Dashboard no se inyectan en las Functions**. La URL del runner tiene que estar en `wrangler.toml`. En la sección `[env.production.vars]` (o la que uses) añade:  
  `RUNNER_URL = "https://tu-app.up.railway.app"`  
  Sustituye por tu URL de Railway, haz commit y push para que el siguiente despliegue use esa variable.
- **Diagnóstico:** Abre en el navegador `https://tu-sitio.pages.dev/api/runner-ping`. Esa ruta prueba la conexión desde Cloudflare al runner y devuelve `ok`, `error` o el mensaje exacto del fallo.
- **Entorno:** Comprueba que `RUNNER_URL` en wrangler.toml esté en el entorno correcto (p. ej. `[env.production.vars]`). Tras cambiar el archivo, haz un **nuevo despliegue**.
- **Sin caché:** Las respuestas del proxy ya envían `Cache-Control: no-store` para no cachear errores.

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
3. **Configura la URL del backend** para que el panel (Cloudflare) llame al servidor en Railway:
   - Edita **`api-config.js`** y define la URL de tu app en Railway:
   ```javascript
   window.API_BASE = 'https://tu-proyecto.up.railway.app';
   ```
   - Así el botón "Ver Reporte HTML" y el resto de APIs (listar tests, ejecutar, etc.) usarán el backend en Railway y no darán 404 en producción.

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

