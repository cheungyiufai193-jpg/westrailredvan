# 拼Van — 部署指南

## 第一步：创建 Supabase 项目（5 分钟）

1. 访问 https://supabase.com → 点击 "Start your project"
2. 用 GitHub 登录
3. 创建新项目：
   - Name: `pinvan`
   - Database Password: 设置一个强密码
   - Region: `Northeast Asia (Tokyo)` — 离香港最近
   - Pricing Plan: **Free** (免费层)
4. 等待项目创建完成（约 2 分钟）

## 第二步：配置 Supabase 数据库

1. 进入 Supabase Dashboard → SQL Editor
2. 复制 `supabase/migrations/001_init.sql` 的全部内容
3. 粘贴到 SQL Editor → 点击 "Run"
4. 等待执行完成，确认所有表已创建

## 第三步：配置 Supabase Auth

1. 进入 Supabase Dashboard → Authentication → Providers
2. 找到 "Phone" → 点击启用
3. 选择 "SMS" 作为验证方式
4. 配置 Twilio 或使用 Supabase 内置 SMS 服务（免费额度 50条/月）
5. 保存配置

## 第四步：获取 Supabase 密钥

1. 进入 Supabase Dashboard → Settings → API
2. 复制以下两个值：
   - `Project URL` (例如: https://xxxxx.supabase.co)
   - `anon public key` (公开密钥)

## 第五步：配置环境变量

1. 项目根目录下创建 `.env` 文件：

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

2. 替换为第四步获取的实际值

## 第六步：部署到 Cloudflare Pages

### 方式 A：通过 GitHub 自动部署（推荐）

1. 将代码推送到 GitHub 仓库
2. 访问 https://dash.cloudflare.com → Pages
3. 点击 "Create a project" → "Connect to Git"
4. 选择你的 GitHub 仓库
5. 构建设置：
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - **环境变量**: 添加 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`
6. 点击 "Save and Deploy"
7. 部署完成后，Cloudflare 会分配一个 `*.pages.dev` 域名
8. 可选：绑定自定义域名

### 方式 B：通过 Wrangler CLI

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录
wrangler login

# 创建 Pages 项目
wrangler pages project create pinvan

# 部署
npm run build
wrangler pages deploy dist --project-name=pinvan
```

## 第七步：绑定自定义域名（可选）

1. Cloudflare Pages → 你的项目 → Custom domains
2. 添加你的域名（如 `pinvan.app`）
3. 按照提示配置 DNS

## 第八步：验证部署

1. 打开 Cloudflare Pages 分配的 URL
2. 用手机浏览器打开，测试 PWA 安装
3. 测试登录流程
4. 测试路线创建/认领

## 免费额度确认

| 服务 | 免费额度 | 是否够用 |
|------|----------|----------|
| Cloudflare Pages | 无限带宽、500次构建/月 | ✅ |
| Supabase Database | 500MB、2个项目 | ✅ |
| Supabase Auth | 5万 MAU | ✅ |
| Supabase Realtime | 200并发、200万消息/月 | ✅ |
| Supabase Edge Functions | 50万次调用/月 | ✅ |
| Supabase Storage | 1GB | ✅ |
| **总费用** | | **$0/月** |

## 后续维护

- 代码更新：推送到 GitHub → Cloudflare Pages 自动部署
- 数据库备份：Supabase 自动每日备份
- 监控：Cloudflare Analytics + Supabase Dashboard