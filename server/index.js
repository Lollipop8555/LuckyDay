import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3000
const distDir = path.join(__dirname, '..', 'dist')

const app = express()

// 静态资源托管：非 index.html 长缓存，index.html 不缓存
app.use(
  express.static(distDir, {
    setHeaders(res, filePath) {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache')
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
