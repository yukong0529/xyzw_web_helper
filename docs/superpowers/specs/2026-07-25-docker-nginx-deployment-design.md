# Docker Nginx 部署设计

## 目标

为已经通过 `npm run build` 生成的 `dist/` 目录提供可直接部署的 Docker 配置。服务器不安装 Node.js，只使用单个 Nginx 容器，同时提供前端静态资源和现有 `/api` 反向代理能力。

## 部署模型

- Docker 构建上下文为项目根目录，镜像直接复制 `dist/`，不在镜像中执行前端构建。
- 基础镜像使用官方轻量级 Nginx Alpine 镜像。
- 容器监听 `80` 端口，宿主机固定映射为 `4173`。
- 使用 Docker Compose 作为默认启动入口，支持后台启动、自动重启、健康检查和日志轮转。
- 保留通过 `docker build` 与 `docker run` 单独运行的能力。

## Nginx 路由

### 静态资源

- `/` 从 Nginx Web 根目录提供 `dist/` 中的资源。
- 找不到真实文件时回退到 `/index.html`，支持 Vue Router History 路由刷新。
- 对 `index.html` 禁用长期缓存，确保发布后及时加载新版本。
- 对带哈希的静态资源启用长期缓存和 `immutable`。

### API 代理

Nginx 替代 Cloudflare Worker，按最长路径优先匹配并移除代理前缀：

| 本地路径 | 上游地址 |
| --- | --- |
| `/api/weixin-long/*` | `https://long.open.weixin.qq.com/*` |
| `/api/weixin/*` | `https://open.weixin.qq.com/*` |
| `/api/hortor/*` | `https://comb-platform.hortorgames.com/*` |

代理将保留请求方法、查询参数和请求体，并设置当前 Worker 使用的 `User-Agent`、`Accept`、`Origin`、`Referer` 等必要请求头。代理响应附加现有跨域响应头，`OPTIONS` 请求由 Nginx 直接返回。上游使用 HTTPS、SNI 和证书校验。

微信长轮询路由配置较长的读取超时，避免扫码状态查询被默认超时提前终止。

## 容器配置

- Dockerfile 使用标准名称 `Dockerfile`，移除无意义的 `VOLUME` 声明和自定义 `nginx:xyzw` 依赖。
- Compose 服务映射 `4173:80`，设置 `restart: unless-stopped`。
- 健康检查访问容器内首页，仅验证 Nginx 静态服务是否可用，不依赖外部上游状态。
- 容器日志使用 Docker `json-file` 驱动并限制文件大小与数量。
- `.dockerignore` 排除源码、依赖、Git 元数据、测试及其他部署无关文件，只让构建所需的 `dist/` 和 Nginx 配置进入上下文。

## 使用方式

部署前在开发机执行 `npm run build`，然后将项目中的 `dist/`、Dockerfile、Compose 文件和 Nginx 配置上传到服务器。在服务器执行 `docker compose up -d --build`，通过服务器地址的 `4173` 端口访问。

每次发布新的 `dist/` 后重新执行同一条 Compose 命令完成镜像重建和容器替换。

## 验证标准

- Docker Compose 配置能够通过语法解析。
- 镜像能够从现有 `dist/` 成功构建。
- 首页和任意前端 History 路由均返回前端应用。
- 三组 `/api` 路由转发到正确上游且移除本地前缀。
- 容器健康检查可正常转为 healthy。
- 服务只通过宿主机 `4173` 端口对外提供访问。
