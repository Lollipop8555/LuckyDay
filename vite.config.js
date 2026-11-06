import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import pwaServiceWorker from './build/pwa-service-worker.js'

export default defineConfig({
  // 相对路径 base：适配 GitHub Pages 子路径部署（https://<user>.github.io/<repo>/）
  // 对 Docker/nginx、本地 dev/preview 均无影响
  base: './',
  plugins: [
    vue(),
    // 构建后依据产物清单生成 Service Worker，实现离线可用（含动态加载的签文分块）
    pwaServiceWorker()
  ],
  server: {
    host: true,
    port: 5173
  },
  build: {
    target: 'es2015',
    chunkSizeWarningLimit: 600
  }
})
