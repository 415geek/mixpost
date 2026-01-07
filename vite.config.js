import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';
import tailwindcss from "@tailwindcss/vite";
import DefineOptions from 'unplugin-vue-define-options/vite';
import fs from 'fs';
import path from 'path';
import { homedir } from 'os';

export default defineConfig(({ command, mode }) => {
  // Load .env variables
  const env = loadEnv(mode, process.cwd(), '');

  // Default: no special dev server config (safe for production builds)
  let serverConfig = undefined;

  /**
   * Only enable Valet HTTPS certs in LOCAL DEV (vite serve).
   * Never try to read certificates during `vite build` (Railway/CI).
   */
  if (command === 'serve' && env.APP_URL) {
    try {
      const host = new URL(env.APP_URL).host;
      const homeDir = homedir();

      // Allow overriding cert path; default to Valet location
      const certificatesPath =
        env.CERTIFICATES_PATH !== undefined
          ? env.CERTIFICATES_PATH
          : `.config/valet/Certificates/${host}`;

      const keyPath = path.resolve(homeDir, `${certificatesPath}.key`);
      const certPath = path.resolve(homeDir, `${certificatesPath}.crt`);

      // Only set https if both files exist; otherwise fall back to plain http
      if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        serverConfig = {
          https: {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
          },
          hmr: { host },
          host,
        };
      } else {
        // No certs found: still allow dev server to run
        serverConfig = {
          hmr: { host },
          host,
        };
      }
    } catch (e) {
      // If APP_URL isn't a valid URL or anything fails, just run without serverConfig
      serverConfig = undefined;
    }
  }

  return {
    publicDir: 'vendor/mixpost',
    plugins: [
      laravel({
        input: 'resources/js/app.js',
        publicDirectory: 'resources/dist',
        buildDirectory: 'vendor/mixpost',
        refresh: true,
      }),
      vue({
        template: {
          transformAssetUrls: {
            base: null,
            includeAbsolute: false,
          },
        },
      }),
      tailwindcss(),
      DefineOptions(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'resources/js'),
        '@css': path.resolve(__dirname, 'resources/css'),
        '@img': path.resolve(__dirname, 'resources/img'),
      },
    },
    server: serverConfig,
  };
});
