import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // 相对路径 base：适配 GitHub Pages 子路径部署（https://<user>.github.io/<repo>/）
  // 对 Docker/nginx、本地 dev/preview 均无影响
  base: './',
  server: {
    host: true,
    port: 5173
  },
  build: {
    target: 'es2015',
    chunkSizeWarningLimit: 600
  }
})
