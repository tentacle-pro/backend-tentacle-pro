# backend-tentacle-pro

`api.tentacle.pro` 企业内容发布 API 服务 + 管理后台。

## 项目结构

```
backend-tentacle-pro/
├── api/                  # API 服务 (port 3001) — Hono, API Key 鉴权
├── web/                  # 管理后台 (port 3000) — Bun, JWT Cookie 鉴权
├── packages/
│   ├── core/             # 共享类型、错误码、加密工具函数
│   ├── db/               # Drizzle ORM schema、migrations、queries
│   ├── render/           # Markdown → 微信兼容 HTML 渲染引擎
│   ├── ui/               # 管理后台前端组件
│   └── wechat/           # 微信公众号 API 客户端（token 管理、上传、草稿）
├── docs/                 # 部署文档（nginx、systemd 示例配置）
└── .env.example          # 环境变量模板
```

## 快速开始

### 1. 安装依赖

```bash
bun install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，填入以下必填项：
#   DATABASE_URL      — PostgreSQL 连接串
#   ENCRYPTION_KEY    — 32 字节 AES-GCM 密钥的 base64 编码
#   ADMIN_PASSWORD    — 管理后台登录密码
#   ADMIN_JWT_SECRET  — JWT 签名密钥
```

生成 `ENCRYPTION_KEY`：

```bash
bun -e "console.log(Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64'))"
```

### 3. 初始化数据库

```bash
cd packages/db
bun run db:migrate
```

### 4. 启动服务

**开发模式（热重载）：**

```bash
# 终端 1 — API 服务
cd api && bun dev

# 终端 2 — 管理后台
cd web && bun dev
```

**生产模式：**

```bash
cd api && bun start
cd web && bun start
```

## API 服务 (api/)

端口：`3001`，所有业务接口需要 `Authorization: Bearer <API_KEY>` 头。

| 路由 | 说明 |
|------|------|
| `GET /healthz` | 健康检查（无需鉴权） |
| `POST /markdown2html` | Markdown 转微信兼容内联 HTML |
| `POST /post2wechat/upload/permanent-image` | 上传封面图（微信永久素材） |
| `POST /post2wechat/upload/article-image` | 上传正文图（微信 uploadimg） |
| `POST /post2wechat/draft/add` | 新增草稿到公众号草稿箱 |

## 管理后台 (web/)

端口：`3000`，提供模板管理和客户管理功能。

| 路由 | 说明 |
|------|------|
| `POST /auth/login` | 管理员登录，返回 JWT Cookie |
| `POST /admin/clients` | 创建新客户（含公众号绑定） |
| `GET/POST /admin/templates` | 渲染模板管理 |
| `GET/POST /admin/assets` | 静态资源管理 |

## 客户管理

通过管理后台 API 创建客户，服务端负责加密存储所有密钥：

```bash
# 登录，获取 JWT Cookie
curl -c cookies.txt -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"your-admin-password"}'

# 创建客户（绑定公众号）
curl -b cookies.txt -X POST http://localhost:3000/admin/clients \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "corp-a",
    "client_name": "Corp A",
    "api_secret": "tentacle-xxxxxxxxxxxxxxxxxxxxxxxx",
    "wechat_app_id": "wx1234567890abcdef",
    "wechat_app_secret": "your-wechat-app-secret",
    "account_name": "Corp A 公众号"
  }'
```

- `api_secret`：客户端填入技能中的 `API_KEY`，服务端只存 SHA-256 hash
- `wechat_app_secret`：公众号密钥，服务端 AES-GCM 加密后存库，明文不落库

## 鉴权设计

```
客户端 (Agent Skill)
  │  Authorization: Bearer <API_KEY>
  ▼
API 服务
  │  sha256(API_KEY) → 查询 api_clients
  │  → 查询 client_account_bindings
  │  → 解密 wechat_accounts.app_secret_encrypted
  ▼
微信公众号 API
```

客户端只需持有 `API_KEY`，不接触任何微信凭据。

## 生产部署

参考 `docs/` 目录下的示例配置：

- [nginx.conf.example](docs/nginx.conf.example) — Nginx 反向代理（tentacle.pro → 3000，api.tentacle.pro → 3001）
- [systemd.service.example](docs/systemd.service.example) — systemd 服务管理

## 数据库管理

```bash
cd packages/db

# 生成新 migration
bun run db:generate

# 执行 migration
bun run db:migrate

# 可视化管理（Drizzle Studio）
bun run db:studio
```
