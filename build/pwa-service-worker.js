import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const SW_FILENAME = 'sw.js'

/**
 * 递归收集构建产物，返回相对 posix 路径列表。
 * @param {string} dir 目录绝对路径
 * @param {string} root 根目录绝对路径（用于计算相对路径）
 * @param {string[]} out 结果收集数组
 */
function collectFiles(dir, root, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      collectFiles(abs, root, out)
    } else {
      out.push(path.relative(root, abs).split(path.sep).join('/'))
    }
  }
  return out
}

/**
 * 生成 Service Worker 脚本内容。
 * @param {string[]} files 预缓存文件相对路径
 * @param {string} version 缓存版本号
 */
function renderServiceWorker(files, version) {
  const precache = files.map((f) => `'./${f}'`).join(',\n  ')

  return `/* 幸运签 Service Worker —— 由构建流程自动生成，请勿手工修改 */
const CACHE_VERSION = '${version}'
const CACHE_NAME = 'luckyday-' + CACHE_VERSION

// 预缓存清单：构建时注入，含动态加载的签文分块，保证首次联网后完全离线可用
const PRECACHE_URLS = [
  ${precache}
]

// 导航请求的回退页面
const APP_SHELL = './index.html'

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      // 单个资源失败不应阻断整体安装，因此逐个写入
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            await cache.add(new Request(url, { cache: 'reload' }))
          } catch (err) {
            console.warn('[sw] 预缓存失败：', url, err)
          }
        })
      )
      await self.skipWaiting()
    })()
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((key) => key.startsWith('luckyday-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
      await self.clients.claim()
    })()
  )
})

/**
 * 导航请求：优先网络，失败时回退到缓存的 index.html（SPA 单页回退）。
 */
async function handleNavigation(request) {
  const cache = await caches.open(CACHE_NAME)
  try {
    const response = await fetch(request)
    if (response && response.ok) {
      cache.put(APP_SHELL, response.clone())
    }
    return response
  } catch (err) {
    const cached = await cache.match(APP_SHELL)
    if (cached) return cached
    throw err
  }
}

/**
 * 静态资源：缓存优先，后台静默更新（stale-while-revalidate）。
 */
async function handleAsset(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)

  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => null)

  if (cached) return cached

  const response = await network
  if (response) return response
  throw new Error('资源离线且未缓存：' + request.url)
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  // 仅处理同源 GET 请求
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request))
    return
  }

  event.respondWith(handleAsset(request))
})

// 允许页面主动触发更新
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
`
}

/**
 * Vite 插件：构建结束后根据产物清单生成 Service Worker。
 */
export default function pwaServiceWorker() {
  let outDir = 'dist'

  return {
    name: 'luckyday-pwa-service-worker',
    apply: 'build',

    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },

    closeBundle() {
      if (!fs.existsSync(outDir)) return

      const files = collectFiles(outDir, outDir)
        // 排除 sourcemap 与已存在的 sw（避免自我缓存）
        .filter((f) => !f.endsWith('.map') && f !== SW_FILENAME && f !== '.DS_Store')
        .sort()

      // 版本号由产物清单派生：文件集合变化即自动换新缓存
      const digest = crypto
        .createHash('md5')
        .update(files.join('|'))
        .digest('hex')
        .slice(0, 10)

      fs.writeFileSync(
        path.join(outDir, SW_FILENAME),
        renderServiceWorker(files, digest),
        'utf8'
      )

      this.warn?.(`[pwa] 已生成 ${SW_FILENAME}，预缓存 ${files.length} 个文件`)
    }
  }
}
