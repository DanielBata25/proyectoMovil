// Prod (backend público con HTTPS válido)
export const environment = {
  production: true,
  apiUrl: 'https://lawana-unhale-sorrowfully.ngrok-free.dev/api/v1/',
  /** En build nativo coincide con la URL real (no se usa proxy) */
  apiUrlBrowser: '',
};         

