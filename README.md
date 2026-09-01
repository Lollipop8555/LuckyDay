# 幸运签

一个抽签的网页项目，可以在网页上进行抽签，抽签结果会显示在网页上，并提供签的分析结果。

## 功能

- 抽签的结果会保存到浏览器本地，有效时间为自然天，当天再次打开网页，会显示历史结果，但是允许再次抽签。
- 抽签基于「设备指纹 + 时间信息」加权计算，将计算结果转换并且映射到内置的抽签数据。设备指纹保存在浏览器本地，同一天内首次抽签结果确定，重抽则随机抽签。
- 内置两套抽签数据，一套为：浅草寺观音一百签（`data/data.zh.json`），另一套为：诸葛神算三百八十四签（`data/chims.chs.json`）。
- 页面上支持两个抽签系统分别抽签，并且记录的数据也是相互独立的。
- 初始化状态下，页面只有下方的「抽签」和切换抽签系统的 Tab 按钮。
- 点击「抽签」后，屏幕中央出现竖直签条的展开动画；每张签条为长条形，仅展示评级（如上上签）与签文。签文两句一列、并排两列，前面一列高一点、后面一列低一点，方便区分先后（浅草寺观音签按换行拆分签文，诸葛神算按逗号、句号拆分）。
- 签条在屏幕上下居中、单行水平排列（不换行），滑动区与屏幕同宽，可横向滑动或鼠标滚轮翻动；最新签固定在右缘不超出屏幕，其余签条从它左侧叠放滑过。
- 点击任意一张签条，即可在对话框中查看该签的完整解析，签文以行展示（一行两句，共 2 行）。
- 抽签之后，屏幕上始终展示抽到的签，下方抽签按钮变为「重抽」。
- 抽到「凶」「下下签」「中下签」「下签」的时候，弹出提示「哎呀，这支不太好，锦鲤帮你重抽一支」，抽到的不好的签照常保留展示（不替换、不消失），并自动帮用户再点一次「重抽」、走完整抽签流程（含求签中占位），直到抽到非上述签为止。

## 技术栈

- 前端：Vue 3 + Vite（H5 移动风格，窄屏 / 宽屏自适应）
- 纯静态站点，无后端依赖，构建产物 `dist/` 由 NGINX 托管
- 部署镜像：`nginx:alpine`

> 说明：原方案为 Node.js (Express) 提供后端 API（用于基于用户 IP 加权计算）。经评估：浏览器端无法直接获取用户 IP，且两套签数据、抽签、解签、历史记录均为纯前端能力，故简化为静态站点。以「设备指纹（浏览器本地随机 ID）+ 时间」替代「IP + 时间」作为抽签加权种子，效果等价，且更轻量、更隐私。

## 本地开发

```bash
npm install
npm run dev      # Vite 开发服务器，默认 http://localhost:5173
```

## 构建与预览

```bash
npm run build    # 产物输出到 dist/
npm run preview  # 本地预览构建产物
```

## Docker 部署

部署结构：`docker-compose.yml` 与项目（`app`）同级，放在 `dockerApp/` 根目录，不被 git 管理，compose 不涉及项目内部结构：

```
dockerApp/
├── app/            # 本项目
└── docker-compose.yml
```

直接用 `node:20` 镜像，挂载源码，容器启动时自动安装依赖、构建并启动服务。**更新代码后只需 `docker compose restart`，容器重启即自动重新构建，无需手动操作**：

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
docker compose up -d       # 首次部署：拉镜像、装依赖、构建并启动
```

代码更新后只需重启：

```bash
docker compose restart     # 容器重启时自动重新构建，改动即刻生效
```

说明：项目内置简易 Express 静态服务（`server/index.js`，`npm start`），生产环境托管构建产物 `dist/`，与 ApkSignerOnline 的服务端模式一致。容器内端口为 3000，映射到宿主机的 3902。

常用命令：

```bash
docker compose ps          # 查看运行状态
docker compose logs -f     # 查看日志
docker compose down        # 停止并移除容器
```

## 目录结构

```
├── data/                 # 两套抽签数据（构建时打包进前端）
├── src/                  # Vue 3 源码
│   ├── components/       # 签卡片、解签对话框等组件
│   └── utils/            # 抽签算法、按天历史存储
├── index.html
├── vite.config.js
├── Dockerfile            # nginx:alpine
└── nginx.conf            # 静态托管与缓存配置
```
