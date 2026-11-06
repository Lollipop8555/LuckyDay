import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3000
const distDir = path.join(__dirname, '..', 'dist')

const app = express()

// 静态资源缓存策略：
// - sw.js / manifest / index.html / json 数据：不缓存，保证能及时更新
// - 其余带内容哈希的构建产物：长期强缓存
app.use(
  express.static(distDir, {
    setHeaders(res, filePath) {
      const name = path.basename(filePath)
      const noCache =
        name === 'index.html' ||
        name === 'sw.js' ||
        name === 'manifest.webmanifest' ||
        filePath.endsWith('.json')

      if (noCache) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
      } else {
        res.setHeader('Cache-Control', 'public, max-age=2592000') // 30 天
      }
    }
  })
)

// 单页应用路由回退
app.get('*', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`LuckyDay server running at http://0.0.0.0:${PORT}`)
})
