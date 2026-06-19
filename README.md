# 拼Van — 香港紅Van社區拼車平台

> 拼出你的路线 · Ride Together

---

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量（复制 .env.example 为 .env，填入 Supabase 密钥）
cp .env.example .env

# 开发模式
npm run dev

# 生产构建
npm run build
```

## 📦 技术栈（永久免费，$0/月）

| 层级 | 技术 | 费用 |
|------|------|------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS | $0 |
| 后端 | Supabase (PostgreSQL + Realtime + Auth) | $0 |
| 地图 | Leaflet + OpenStreetMap | $0 |
| 推送 | Web Push API (PWA) | $0 |
| 部署 | Cloudflare Pages | $0 |

## 🎯 核心功能

### 乘客端
- 首页地图 + 附近活跃路线
- 路线广场（浏览 + 加入拼车）
- 发起路线（地图选点 + 选人数/时间）
- 行程追踪（实时司机位置 + 状态流转）
- 消息系统（通知 + 司机对话）
- 个人中心（乘车记录/常用路线/评分）

### 司机端
- 路线广场（浏览 + 认领路线）
- 当前行程（座位管理 + 乘客核销 + 长按归零）
- 发布空车（主动发布路线等乘客加入）
- 消息系统（通知 + 乘客对话）
- 个人中心（今日统计/营业状态切换）

### 管理后台
- 数据看板（在线司机/活跃路线/今日行程）
- 司机审核（批准/拒绝）
- 黑名单管理
- 隐藏入口（连续点击标题 5 次）

## 🏗️ 项目结构

```
pinvan/
├── public/              # 静态资源
│   ├── offline.html     # PWA 离线页面
│   └── icons/           # PWA 图标
├── src/
│   ├── components/      # UI 组件
│   │   └── ui/          # Button, Card, Input, MapView...
│   ├── pages/           # 页面
│   │   ├── Login.tsx
│   │   ├── Home.tsx / Explore.tsx / CreateRoute.tsx / Trip.tsx
│   │   ├── DriverHome.tsx / DriverActive.tsx / DriverPublish.tsx
│   │   └── AdminPanel.tsx
│   ├── stores/          # Zustand 状态管理
│   ├── lib/             # Supabase 客户端
│   ├── types/           # TypeScript 类型
│   └── App.tsx          # 主路由
├── supabase/
│   └── migrations/      # 数据库迁移脚本
├── dist/                # 构建产物（630KB）
└── DEPLOY.md            # 部署指南
```

## 📋 部署步骤

详见 [DEPLOY.md](DEPLOY.md)

1. 创建 Supabase 项目 → 运行迁移 SQL
2. 配置 Supabase Auth（手机号 OTP）
3. 填入环境变量（VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY）
4. 部署到 Cloudflare Pages（自动构建 + 全球 CDN）

## 📊 性能

- 首屏加载：~60KB (gzip)
- 构建产物：630KB (总)
- 支持 50 司机 + 100 乘客同时在线
- PWA 离线可用，二次加载 <500ms

---

*拼Van — 永久免费，高效可扩展*