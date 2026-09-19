// frontend/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

const suburbRegionsModuleId = 'virtual:suburb-regions';
const resolvedSuburbRegionsModuleId = `\0${suburbRegionsModuleId}`;

function suburbRegionsPlugin() {
  return {
    name: 'prime-cabs-suburb-regions',
    resolveId(id) {
      return id === suburbRegionsModuleId ? resolvedSuburbRegionsModuleId : null;
    },
    load(id) {
      if (id !== resolvedSuburbRegionsModuleId) return null;

      const suburbs = JSON.parse(
        readFileSync(new URL('./src/data/melbourneSuburbs.json', import.meta.url), 'utf8')
      );
      const regionPairs = suburbs
        .filter((suburb) => suburb?.name)
        .map((suburb) => [String(suburb.name), String(suburb.region || '')]);

      return `export default ${JSON.stringify(regionPairs)};`;
    },
  };
}

export default defineConfig({
  plugins: [react(), suburbRegionsPlugin()],
  define: {
    'import.meta.env.VITE_DISABLE_GOOGLE_TRACKING': JSON.stringify(process.env.VERCEL_ENV === 'preview'),
    'import.meta.env.VITE_IS_PREVIEW': JSON.stringify(process.env.VERCEL_ENV === 'preview'),
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
