import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'portal-agro',
  webDir: 'www',
  plugins: {
    CapacitorHttp: { enabled: true },
    CapacitorCookies: { enabled: true },
  },
  server: {
    cleartext: true
  }
};

export default config;