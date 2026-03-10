---
title: CMS轻量后台实施清单
type: implementation-plan
status: done
owner: dio
created: 2026-03-10
related:
  - "[API服务需求文档 2026Q1](./API服务需求文档 2026Q1.md)"
  - "[README](../README.md)"
---

# CMS轻量后台实施清单

## 1. 目标与范围

本清单用于落地“管理员轻量 CMS”，覆盖以下能力：
- 管理员新增企业客户与公众号托管配置
- 强制填写 APP_ID / APP_SECRET
- 系统自动生成 API_KEY，支持复制
- 支持手动禁用/启用客户
- 支持重新生成 API_KEY
- 统一术语：`api_secret` -> `api_key` / `API_KEY`
- 保持“模板全局共享，不与企业绑定”的既定设计

## 2. 已确认决策

- API_KEY 自动生成
- API_KEY 不要求“只展示一次”，管理员可重复查看
- 需要手动禁用/启用客户
- 本期做“创建并复制 + 重新生成”
- 必须统一命名，避免 `api_secret` 与公众号 `app_secret` 混淆

## 3. 工作拆分与进度

### 3.1 后端接口改造（web server）

- [x] 调整 `POST /admin/clients`：改为服务端自动生成 `api_key`
- [x] 入参保留公众号字段：`wechat_app_id`、`wechat_app_secret`、`account_name`
- [x] 创建成功响应返回可复制 `api_key`
- [x] 新增 `GET /admin/clients`：返回客户列表、绑定公众号、状态、创建时间
- [x] 新增 `PATCH /admin/clients/:clientId/status`：手动禁用/启用
- [x] 新增 `POST /admin/clients/:clientId/regenerate-api-key`：重新生成 key
- [x] 鉴权链路补充 `disabled` 校验，禁用客户调用 API 时拒绝
- [x] 新增/更新错误码（建议 `AUTH_403_CLIENT_DISABLED`）

### 3.2 前端管理台改造（web frontend）

- [x] 新增页面：`/dashboard/clients`
- [x] 页面结构：客户列表 + 新增客户表单
- [x] 表单强校验：APP_ID 必填、APP_SECRET 必填
- [x] 创建成功后展示 API_KEY 卡片并提供复制按钮
- [x] 列表支持禁用/启用按钮
- [x] 列表支持“重新生成 API_KEY”按钮与确认流程
- [x] 导航增加“客户管理”入口，提升信息架构清晰度
- [x] 页面文案明确：模板是全局共享资源，任意有效 API_KEY 可通过 templateId 使用

### 3.3 文档与术语统一

- [x] README 中示例和说明统一使用 `API_KEY` / `api_key`
- [x] 需求文档更新非目标条目：从“仅 API 服务”改为“轻量管理员后台”
- [x] 在需求文档中增加“模板全局共享，不与企业绑定”的明确说明

### 3.4 验收与回归

- [x] 新增客户流程通过（返回 API_KEY，可复制）
- [x] 客户禁用后，业务 API 调用被拒绝
- [x] 客户重新启用后恢复调用
- [x] API_KEY 重新生成后：旧 key 失效，新 key 生效
- [x] 模板跨企业调用仍然可用（符合设计预期）

## 4. 建议实现顺序

1. 后端接口与鉴权状态校验
2. 前端客户管理页与导航
3. 文档与术语同步
4. 联调与回归测试

## 5. 设计执行建议（结合 Impeccable cheatsheet）

为避免“能用但难用”，UI 实施阶段建议按以下命令思路走一次：

- `/clarify`：统一字段命名与按钮文案，降低配置歧义
- `/adapt`：保证桌面和小屏都能顺畅操作表单与表格
- `/harden`：补齐错误态、空态、加载态、复制失败提示
- `/polish`：上线前做间距、层级、对齐和交互细节收尾

可选增强：
- `/normalize`：和现有后台视觉语言对齐
- `/optimize`：减少列表刷新与操作等待体感

## 6. 里程碑与状态

- 当前状态：`completed`
- 预计工期：2-3 个开发日（不含上线审批）
- 下一步：整理提交记录并进入后续增强项（如批量管理、到期自动禁用）

## 7. 联调与回归执行清单（可直接跑）

1. 管理员登录，获取 Cookie

```bash
curl -c cookies.txt -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"your-admin-password"}'
```

2. 创建客户（服务端自动返回 api_key）

```bash
curl -b cookies.txt -X POST http://localhost:3000/admin/clients \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "corp-a",
    "client_name": "Corp A",
    "wechat_app_id": "your-wechat-app-id",
    "wechat_app_secret": "your-wechat-app-secret",
    "account_name": "Corp A 公众号"
  }'
```

3. 列出客户，确认状态与绑定信息

```bash
curl -b cookies.txt http://localhost:3000/admin/clients
```

4. 禁用客户

```bash
curl -b cookies.txt -X PATCH http://localhost:3000/admin/clients/corp-a/status \
  -H "Content-Type: application/json" \
  -d '{"status":"disabled"}'
```

5. 重新启用客户

```bash
curl -b cookies.txt -X PATCH http://localhost:3000/admin/clients/corp-a/status \
  -H "Content-Type: application/json" \
  -d '{"status":"active"}'
```

6. 重新生成 API_KEY（旧 key 立即失效）

```bash
curl -b cookies.txt -X POST http://localhost:3000/admin/clients/corp-a/regenerate-api-key
```

7. 验证禁用态鉴权（预期 403 + AUTH_403_CLIENT_DISABLED）

```bash
curl -i -X POST http://localhost:3001/markdown2html \
  -H "Authorization: Bearer <DISABLED_CLIENT_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"markdown":"# test","templateId":"default"}'
```
