import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';
import tailwindcss from "@tailwindcss/vite";
import DefineOptions from 'unplugin-vue-define-options/vite';
import fs from 'fs';
import path from 'path';
import { homedir } from 'os';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // 默认不启用 https/server 配置（Railway build 不需要）
  let serverConfig = undefined;

  // 只在本地开发启动 dev server 时（vite serve）才尝试读取 valet 证书
  const isDevServer = command === 'serve';

  if (isDevServer && env.APP_URL) {
    try {
      const host = new URL(env.APP_URL).host;
      const homeDir = homedir();

      const certificatesPath =
        env.CERTIFICATES_PATH !== undefined
          ? env.CERTIFICATES_PATH
          : `.config/valet/Certificates/${host}`;

      const keyPath = path.resolve(homeDir, `${certificatesPath}.key`);
      const certPath = path.resolve(homeDir, `${certificatesPath}.crt`);

      // 证书存在才启用 https（否则别炸）
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
        // 没证书就用普通 http dev server
        serverConfig = {
          hmr: { host },
          host,
        };
      }
    } catch (e) {
      // APP_URL 不是合法 URL 或其他异常：直接不设置 serverConfig
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
