# 幸运签

一个运行在网页上的抽签工具：内置浅草寺观音签、妈祖灵签、诸葛神算三套签库，可切换求签、保存当日记录、查看完整解签。

## 功能

- 三套签库：浅草寺观音签（一百签）、妈祖灵签（六十甲子签）、诸葛神算（三百八十四签），顶部一键切换，三套系统的抽签记录相互独立。
- 当日记录：抽签结果保存在浏览器本地，按自然天记录；当天再次打开页面可查看当日所抽的签，次日自动清空。
- 首签稳定：每个自然天抽到的第一支签结果固定（刷新页面不会变化），此后再抽则为随机结果。
- 吉凶评级：观音签按「大吉 / 吉 / 半吉 / 小吉 / 末吉 / 末小吉 / 凶」评级，诸葛神算按「上上签 / 上签 / 中上签 / 中签 / 中下签 / 下签 / 下下签」评级；妈祖签无吉凶评级，以干支标示。
- 锦鲤重抽：观音签抽到「凶」、诸葛神算抽到「下签」及以下时，会提示并自动重抽，直到抽到更吉的签；不佳的签也会保留在记录中。
- 完整解签：点击抽到的任意一支签，可查看该签的签文与解读——观音签含「解曰 / 所求 / 注意」，妈祖签含「典故 / 白话解签 / 各事预兆」，诸葛神算含「签意 / 详解 / 白话解读」。

## 技术栈

- 前端：Vue 3 + Vite
- 服务：Express 静态托管（`npm start`），生产环境托管构建产物 `dist/`
- 静态托管：可选 NGINX 方案，配置文件见 `nginx.conf`

## 本地开发

```bash
npm install
npm run dev      # Vite 开发服务器，默认 http://localhost:5173
```

## 构建与部署

```bash
npm run build     # 构建产物输出到 dist/
npm run preview   # 本地预览构建产物
npm start         # Express 静态服务托管 dist/（端口 3000，可用 PORT 环境变量覆盖）
```

若采用 NGINX 托管，将 `nginx.conf` 作为站点配置挂载到 `/etc/nginx/conf.d/`，根目录指向 `dist/` 即可。

## Docker 部署

`docker-compose.yml` 放在项目同级目录下（不属于本项目，不被 git 管理）：

```
dockerApp/
├── app/            # 本项目
└── docker-compose.yml
```

`dockerApp/docker-compose.yml`：

```yaml
version: '3.8'

services:
  luckyday:
    image: node:20
    container_name: LuckyDay
    restart: always
    ports:
      - "3902:3000"
    volumes:
      - ./app:/app
    working_dir: /app
    command: sh -c "npm install && npm run build && npm start"
```

使用：

```bash
cd dockerApp
docker compose up -d       # 首次部署：构建并启动
docker compose restart     # 代码更新后重启，重启时自动重新构建
docker compose ps          # 查看运行状态
docker compose logs -f     # 查看日志
docker compose down        # 停止并移除容器
```

容器内服务监听 3000 端口，映射到宿主机 3902。

## 目录结构

```
├── data/                 # 三套签数据（浅草寺观音签、妈祖灵签、诸葛神算）
├── src/                  # Vue 3 源码
│   ├── components/       # 界面组件（签条、解签弹窗等）
│   ├── utils/            # 抽签与记录逻辑
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── server/               # Express 静态服务（生产托管 dist/）
├── index.html
├── vite.config.js
├── nginx.conf            # 可选的 NGINX 静态托管配置
└── LICENSE               # MIT 许可证
```
