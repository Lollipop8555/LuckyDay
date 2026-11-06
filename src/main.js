import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import { registerServiceWorker } from './utils/pwa.js'

createApp(App).mount('#app')

// 注册 Service Worker，支持离线运行（仅生产构建生效）
registerServiceWorker()
