import { defineConfig, loadEnv } from 'vite'
import laravel from 'laravel-vite-plugin'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import DefineOptions from 'unplugin-vue-define-options/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')

    const isProduction = mode === 'production'

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

        // 🚫 Railway / production 下完全禁用 https / valet
        server: isProduction
            ? {}
            : {
                  host: 'localhost',
              },
    }
})
