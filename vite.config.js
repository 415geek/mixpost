import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';
import tailwindcss from "@tailwindcss/vite";
import DefineOptions from 'unplugin-vue-define-options/vite';
import fs from 'fs';
import path from 'path';
import { homedir } from 'os';

export default defineConfig(({ command, mode }) => {
  // Load current .env-file
  const env = loadEnv(mode, process.cwd(), '');

  // Build a safe server config:
  // - Only enable Valet/HTTPS certs for LOCAL DEV (command === 'serve')
  // - Never try to read certs during build/CI/Railway
  const isDevServer = command === 'serve';

  // Railway sets RAILWAY_ENVIRONMENT (and often RAILWAY_STATIC_URL / etc.)
  const isRailway = !!process.env.RAILWAY_ENVIRONMENT;

  // If you want manual override, set DISABLE_VITE_HTTPS=1 in Railway Variables
  const disableHttps = env.DISABLE_VITE_HTTPS === '1' || env.DISABLE_VITE_HTTPS === 'true';

  let serverConfig = {};

  if (isDevServer && !isRailway && !disableHttps) {
    // Only for local dev
    const appUrl = env.APP_URL || '';
    let host = null;

    try {
      host = appUrl ? new URL(appUrl).host : null;
    } catch (e) {
      host = null;
    }

    const homeDir = homedir();

    if (host && homeDir) {
      const certificatesPath =
        env.CERTIFICATES_PATH !== undefined
          ? env.CERTIFICATES_PATH
          : `.config/valet/Certificates/${host}`;

      // Read certs ONLY if files exist; otherwise fallback to plain HTTP dev server
      const keyPath = path.resolve(homeDir, `${certificatesPath}.key`);
      const crtPath = path.resolve(homeDir, `${certificatesPath}.crt`);

      const hasKey = fs.existsSync(keyPath);
      const hasCrt = fs.existsSync(crtPath);

      if (hasKey && hasCrt) {
        serverConfig = {
          https: {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(crtPath),
          },
          hmr: { host },
          host,
        };
      } else {
        // No certs found locally -> use HTTP dev server
        serverConfig = {
          host: true,
        };
      }
    } else {
      // No APP_URL or invalid URL -> use HTTP dev server
      serverConfig = {
        host: true,
      };
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
