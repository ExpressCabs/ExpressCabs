// frontend/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_DISABLE_GOOGLE_TRACKING': JSON.stringify(process.env.VERCEL_ENV === 'preview'),
    ...(process.env.VERCEL_ENV === 'preview'
      ? { 'import.meta.env.VITE_OTP_VERIFICATION_ENABLED': JSON.stringify('false') }
      : {}),
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
