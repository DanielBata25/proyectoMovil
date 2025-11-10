// Prod (backend público con HTTPS válido)
export const environment = {
  production: true,
  apiUrl: 'http://172.30.6.184:5253/api/v1/',
  /** En build nativo coincide con la URL real (no se usa proxy) */
  apiUrlBrowser: 'http://172.30.6.184:5253/api/v1/',
};         
