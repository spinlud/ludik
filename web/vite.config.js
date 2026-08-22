import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const stylesDir = fileURLToPath(new URL('./src/styles', import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Resolve `@import 'helpers/...'` from the shared styles directory.
        loadPaths: [stylesDir],
        // Inject the shared SCSS helpers into every stylesheet so components
        // can use variables, colors and mixins without importing them.
        additionalData: `@use "sass:math";
@import "helpers/variables";
@import "helpers/colors";
@import "helpers/mixins";
`,
      },
    },
  },
})
