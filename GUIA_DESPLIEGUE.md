# 🚀 Guía de Despliegue

Guía única para desplegar el Panel de Control Playwright en Cloudflare Pages y/o Railway.

---

## 📋 Pre-requisitos

- ✅ Cuenta en [Cloudflare](https://dash.cloudflare.com/) (gratuita)
- ✅ Repositorio en GitHub (`Jhon202211/qapanel` o `queodevteam/playwright`)
- ✅ Código subido al repositorio

---

## ⚠️ Limitaciones Importantes

**Playwright NO puede ejecutarse directamente en Cloudflare Pages/Workers** debido a:

- ❌ No hay acceso al sistema de archivos completo
- ❌ No se pueden ejecutar procesos hijos (`exec`, `spawn`)
- ❌ No hay navegadores instalados
- ❌ Limitaciones de tiempo de ejecución (10-30 segundos en Workers)

### ❌ Lo que NO funcionará en Cloudflare Pages

- **Ejecutar tests de Playwright**: No hay acceso al sistema de archivos ni a procesos hijos
- **Codegen**: Requiere ejecutar comandos del sistema
- **Leer/Escribir archivos de tests**: No hay acceso al sistema de archivos
- **Ejecutar comandos del servidor**: No se pueden ejecutar `exec` o `spawn`

### ✅ Lo que SÍ funcionará

- **Panel HTML**: Se mostrará correctamente
- **Interfaz de usuario**: Todos los elementos visuales funcionarán
- **APIs vía proxy**: Las funciones en `functions/api/` pueden hacer proxy al runner en Railway (listar tests, ejecutar, reporte)

---

## Opciones de Despliegue

### Opción 1: Panel en Cloudflare Pages (recomendado para la UI)

Despliega solo el panel HTML como sitio estático. Para ejecutar tests y ver el reporte necesitarás el **playwright-runner** en Railway (opción híbrida).

#### Paso 1: Acceder a Cloudflare Dashboard

1. Ve a [https://dash.cloudflare.com/](https://dash.cloudflare.com/)
2. Inicia sesión con tu cuenta
3. En el menú lateral, haz clic en **"Pages"**

#### Paso 2: Crear nuevo proyecto

1. Haz clic en **"Create a project"**
2. Selecciona **"Connect to Git"**
3. Autoriza Cloudflare Pages a acceder a tu cuenta de GitHub
4. Selecciona el repositorio: `Jhon202211/qapanel` o `queodevteam/playwright`
5. Selecciona la rama (ej. `alexdev`) y haz clic en **"Begin setup"**

#### Paso 3: Configurar Build

```
Framework preset: None
Build command: (vacío o echo "No build required")
Build output directory: /
Root directory: /
```

- **Root directory** debe ser la raíz para que se desplieguen también `functions/` y `api-config.js`.

#### Paso 4: Variables de entorno (opcional)

1. En **"Environment variables (advanced)"** agrega si aplica:
   - `NODE_ENV` = `production`
   - **`RUNNER_URL`** = URL de tu runner en Railway (ej. `https://playwright-runner-production-8434.up.railway.app`)  
     Necesaria para que el panel liste y ejecute tests vía proxy. Si Cloudflare gestiona vars con `wrangler.toml`, define `RUNNER_URL` ahí (ver sección híbrida).

#### Paso 5: Desplegar

1. **"Save and Deploy"**
2. Espera 1–2 minutos. Obtendrás una URL como `https://tu-proyecto.pages.dev`

#### Paso 6: Dominio personalizado (opcional)

En el proyecto → **Custom domains** → **Set up a custom domain** → configura DNS según las instrucciones.

---

### Opción 2: Servidor completo en Railway o Render

Para **todas** las funcionalidades (ejecutar tests, codegen, etc.) en un solo servicio, despliega el servidor Express del repo (no el playwright-runner) en un servicio Node:

#### Railway

1. Ve a [Railway.app](https://railway.app/), inicia sesión con GitHub
2. **New Project** → **Deploy from GitHub repo** → elige el repositorio
3. Railway detectará `package.json` y `server.js`
4. Configura variables de entorno si hace falta
5. URL resultante tipo: `https://tu-app.up.railway.app`

#### Render

1. [Render.com](https://render.com/) → **New** → **Web Service**
2. Conecta el repositorio
3. **Build Command**: `npm install` · **Start Command**: `npm start` · **Environment**: Node
4. Añade variables de entorno y crea el servicio

---

### Opción 3: Híbrido (recomendado para producción)

Panel en **Cloudflare Pages** y ejecución de tests en **playwright-runner** en **Railway**.

#### 1. Desplegar playwright-runner en Railway

- Repo del runner: el proyecto **playwright-runner** (backend mínimo: `/tests`, `/run`, `/api/open-report`, `/report`).
- Despliega ese repo en Railway y anota la URL (ej. `https://playwright-runner-production-8434.up.railway.app`).

#### 2. Configurar el panel en Cloudflare

- **Variables**: En el proyecto de Pages → **Settings** → **Environment variables** añade:
  - **Name:** `RUNNER_URL`
  - **Value:** `https://tu-runner.up.railway.app` (sin barra final)
- Si Cloudflare indica que las variables se gestionan con **wrangler.toml**, añade en `[env.production.vars]`:
  ```ini
  RUNNER_URL = "https://tu-runner.up.railway.app"
  ```
- Guarda y haz un **Redeploy** para que las Functions usen `RUNNER_URL`.

#### 3. Ver Reporte HTML en producción

En **`api-config.js`** del repo del panel define la URL del runner:

```javascript
window.REPORT_SERVICE_URL = 'https://tu-runner.up.railway.app';
```

El panel llamará directamente al runner para el reporte (no depende del proxy). El runner debe tener las rutas `/api/open-report` y `/report` y haber ejecutado al menos un test para que exista el reporte.

#### Si el panel no conecta con el runner

- **Diagnóstico:** Abre `https://tu-sitio.pages.dev/api/runner-ping`. Comprueba si la conexión al runner devuelve ok o error.
- **wrangler.toml:** Si las variables se gestionan ahí, `RUNNER_URL` debe estar en la sección correcta (p. ej. `[env.production.vars]`). Tras cambiar, haz **Redeploy**.
- **Sin caché:** El proxy ya envía `Cache-Control: no-store`.

#### Si "Ver Reporte HTML" da 404

1. **Comprueba Functions:** Abre `https://tu-sitio.pages.dev/api/status`. Si ves JSON, las Functions están activas; si 404, revisa que la rama y el root incluyan `functions/`.
2. **Rama y redeploy:** Asegúrate de desplegar desde la rama con los últimos cambios (ej. `alexdev`) y haz **Redeploy**.
3. **REPORT_SERVICE_URL:** Comprueba que en `api-config.js` esté definida la URL del runner (igual que `RUNNER_URL`).

#### Arquitectura

```
┌─────────────────────────┐
│  Cloudflare Pages       │
│  (Panel HTML estático)  │
│  + functions/api (proxy)│
└───────────┬─────────────┘
            │ RUNNER_URL / REPORT_SERVICE_URL
            ▼
┌─────────────────────────┐
│  Railway                │
│  (playwright-runner)     │
│  GET /tests, POST /run  │
│  GET /api/open-report   │
│  GET /report (HTML)     │
└─────────────────────────┘
```

---

## 📁 Archivos de configuración

- **wrangler.toml** – Configuración de Cloudflare Pages/Workers y vars (ej. `RUNNER_URL`)
- **functions/api/[[path]].ts** – Funciones serverless (proxy a list-tests, run-command, open-report, etc.)
- **api-config.js** – En el cliente: `API_BASE` (opcional) y `REPORT_SERVICE_URL` (recomendado en producción para el reporte)
- **_redirects** – Reglas de redirección si se usan
- **cloudflare-pages.json** – Configuración alternativa de Pages si aplica

El **server.js** del repo del panel sigue funcionando en local con `npm start`.

---

## 🧪 Probar el despliegue

1. Visita la URL de Cloudflare Pages; deberías ver el panel.
2. Prueba `https://tu-sitio.pages.dev/api/status` (debe devolver JSON).
3. Con híbrido: ejecuta un test desde el panel y luego **Ver Reporte HTML** (debe abrir la URL del reporte del runner).

---

## 🆘 Solución de problemas

| Problema | Qué revisar |
|----------|-------------|
| Build failed | Repo conectado, `playwright-panel.html` en la raíz (o en el root configurado) |
| 404 en la página | Que existan `index.html` o `playwright-panel.html` y que "Build output directory" sea correcto |
| APIs no responden / 404 | Que la carpeta `functions/` esté en la raíz del proyecto que se despliega y que la rama sea la correcta |
| No se conecta al runner | `RUNNER_URL` en Cloudflare (Dashboard o wrangler.toml) y **Redeploy** |
| Reporte no se abre | `REPORT_SERVICE_URL` en `api-config.js`, runner desplegado con `/api/open-report` y `/report`, y al menos un test ejecutado |

---

## 📞 Resumen y próximos pasos

- **Desarrollo local:** `npm start` (servidor Express del panel).
- **Solo UI en producción:** Despliega el panel en Cloudflare Pages (Opción 1).
- **Producción con tests y reporte:** Usa la opción híbrida (Opción 3): panel en Cloudflare + **playwright-runner** en Railway y `REPORT_SERVICE_URL` en `api-config.js`.
