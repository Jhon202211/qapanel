# Guía de Despliegue en Cloudflare Pages

## ⚠️ Limitaciones Importantes

**Playwright NO puede ejecutarse directamente en Cloudflare Pages/Workers** debido a:

- ❌ No hay acceso al sistema de archivos completo
- ❌ No se pueden ejecutar procesos hijos (`exec`, `spawn`)
- ❌ No hay navegadores instalados
- ❌ Limitaciones de tiempo de ejecución (10-30 segundos en Workers)

## Opciones de Despliegue

### Opción 1: Panel Estático en Cloudflare Pages (Recomendado para UI)

Esta opción despliega solo el panel HTML como sitio estático. Las funcionalidades de ejecución de tests requerirían un servicio externo.

**Pasos:**

1. **Conectar el repositorio a Cloudflare Pages:**
   - Ve a [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Selecciona "Pages" → "Create a project"
   - Conecta tu repositorio de GitHub: `Jhon202211/qapanel` o `queodevteam/playwright`
   - Selecciona la rama `alexdev` (o la que prefieras)

2. **Configuración de Build:**
   - **Framework preset**: `None` (o `Create React App` si prefieres)
   - **Build command**: `echo "No build required"` (o déjalo vacío)
   - **Build output directory**: `/` (raíz)
   - **Root directory**: `/` (raíz)

3. **Variables de entorno (opcional):**
   - Si necesitas variables de entorno, agrégalas en "Environment variables"
   - Ejemplo: `BASE_URL`, `NODE_ENV`, etc.

4. **Desplegar:**
   - Cloudflare Pages construirá y desplegará automáticamente
   - Obtendrás una URL como: `https://playwright-panel.pages.dev`

### Opción 2: Servidor Completo en Railway/Render (Recomendado para funcionalidad completa)

Para tener todas las funcionalidades del servidor Express (ejecutar tests, codegen, etc.), despliega el servidor en un servicio que soporte Node.js:

#### Railway (Recomendado)

1. Ve a [Railway.app](https://railway.app/)
2. Conecta tu repositorio
3. Railway detectará automáticamente el `package.json`
4. Configura las variables de entorno necesarias
5. El servidor se desplegará automáticamente

#### Render

1. Ve a [Render.com](https://render.com/)
2. Crea un nuevo "Web Service"
3. Conecta tu repositorio
4. Configura:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `Node`
5. Agrega variables de entorno
6. Despliega

### Opción 3: Híbrido (Panel en Cloudflare + API en Railway)

1. Despliega el panel HTML en Cloudflare Pages (Opción 1)
2. Despliega el servidor Express en Railway (Opción 2)
3. Configura la URL del backend en **`api-config.js`**:
   ```javascript
   window.API_BASE = 'https://tu-proyecto.up.railway.app';
   ```
   Así "Ver Reporte HTML" y el resto de APIs llamarán al backend en Railway en producción.

## Archivos de Configuración Creados

- `wrangler.toml`: Configuración para Cloudflare Workers/Pages
- `functions/api/[[path]].ts`: Funciones serverless para APIs (limitadas)
- `_redirects`: Reglas de redirección para Cloudflare Pages
- `cloudflare-pages.json`: Configuración alternativa para Pages

## Próximos Pasos Recomendados

1. **Para desarrollo local**: Sigue usando `npm start` (servidor Express)
2. **Para producción con funcionalidad completa**: Despliega en Railway o Render
3. **Para solo el panel UI**: Despliega en Cloudflare Pages

## Notas Adicionales

- El archivo `server.js` original seguirá funcionando localmente
- Las funciones en `functions/api/` son adaptaciones básicas con limitaciones
- Para funcionalidad completa, se requiere un servicio que soporte Node.js y procesos del sistema

