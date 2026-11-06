/**
 * 注册 Service Worker，使应用支持离线运行。
 * 仅在构建产物环境（http/https 且非本地开发服务器）下生效。
 */
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

  // 开发服务器下不注册，避免缓存干扰热更新
  if (import.meta.env.DEV) return

  window.addEventListener('load', () => {
    // 使用相对路径，兼容 GitHub Pages 等子路径部署
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('[pwa] Service Worker 注册失败：', err)
    })
  })
}
