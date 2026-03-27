import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.trikdev.playme',
  appName: 'Play Me',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '742584976934-0nmes6v5qfv9vfhiqgvdcoa9qls9h86i.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
