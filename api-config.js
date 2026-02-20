/**
 * Configuración de la URL base del API (backend).
 * - En local (mismo servidor Express): dejar vacío.
 * - En producción (panel en Cloudflare Pages + backend en Railway): definir la URL de tu app Railway.
 *   Ejemplo: window.API_BASE = 'https://tu-proyecto.up.railway.app';
 */
window.API_BASE = '';

/**
 * URL del runner (playwright-runner en Railway) para "Ver Reporte HTML".
 * El panel llama directamente a esta URL; no depende del proxy de Cloudflare.
 * Misma URL que RUNNER_URL en wrangler.toml / Cloudflare.
 */
window.REPORT_SERVICE_URL = 'https://playwright-runner-production-8434.up.railway.app';
