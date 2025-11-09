import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'Ionic-app',
  webDir: 'www',
  server: {
    cleartext: true, // permite http://
    androidScheme: 'http',
    hostname: '192.168.20.28',
  }
};

export default config;
