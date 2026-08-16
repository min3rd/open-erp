import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vn9melody.openerp',
  appName: 'Open ERP Mobile',
  webDir: 'dist/open-erp-mobile/browser',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f172a',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#4f46e5'
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f172a'
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true
    }
  }
};

export default config;
