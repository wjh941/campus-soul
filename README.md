# 同频 · 真实社交与深度匹配

## 前端架构

```text
src/
  main.tsx                # 入口：鉴权回调拦截 + Service Worker 注册
  App.tsx                 # 应用壳层：侧边栏/顶栏/路由出口/全局弹层（约 160 行）
  routes/                 # 每个视图一个路由组件（HashRouter：/#/matches 等）
  context/                # AppContext（跨视图状态）+ AppProvider（副作用与动作）
  components/
    layout/               # Sidebar / Topbar / MobileNav
    common/               # Avatar / PageLoading
    discovery/            # MatchCard / ProfileModal / GuestActivation / GuestAgeGate / …
    moments/              # Composer / PostCard
    auth/                 # AuthModal / Onboarding / AuthCallback
    chat|assessment|profile|trust/…  # 其余领域组件（懒加载）
  hooks/                  # useDialogLifecycle / useOnlineStatus / usePointerRipple
  lib/                    # supabase / navigation / demo 数据 / 领域 API 封装
```

- 路由使用 `react-router-dom` 的 `HashRouter`（`?view=` 手写路由已移除），兼容 GitHub Pages 项目站点，无需服务端回退配置。
- 样式：全局只有 `index.css`（reset/基础）与 `App.css`（按原始级联顺序合并的整合层）；组件自身样式放在同目录的 `*.module.css`（CSS Modules），如 `GuestActivation.module.css`。
- 测试：Vitest + React Testing Library，覆盖登录/注册流程、匹配列表渲染与筛选、聊天发送与草稿恢复、举报/拉黑入口、发布器草稿与图片校验等。

```bash
npm run test        # vitest run（组件与单元测试）
npm run test:watch  # watch 模式
npm run test:smoke  # 结构冒烟断言（CI 中单独执行）
npm run lint        # oxlint
npm run check:css   # CSS 花括号完整性（递归扫描 src/）
```

## 从演示模式上线

页面显示“Supabase 尚未配置”或“演示模式”，是因为 Vite 构建时没有读取 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_ANON_KEY`。它们必须在部署平台的构建环境中配置，不能只配置在本地电脑。

### 1. 创建并配置 Supabase

1. 在 Supabase 创建项目。
2. 在 SQL Editor 中按顺序执行 `supabase/migrations/` 下的 SQL；生产项目建议使用 Supabase CLI 管理迁移。
3. 在 Auth → URL Configuration 中，将正式站点加入 Site URL 和 Redirect URLs，例如 `https://campus-soul.vercel.app/**` 与 `https://wjh941.github.io/campus-soul/**`。
4. 创建并检查迁移所需的 Storage bucket（头像、动态图片、验证材料），确认 Storage RLS 只允许本人写入、授权用户读取。
5. Auth 邮件服务使用正式 SMTP；开发阶段默认邮件服务有发送频率限制。
6. 从 Project Settings → API 复制 Project URL 和 publishable/anon key。

### 2. 配置 Vercel

在 Vercel 项目 Settings → Environment Variables 添加：

```text
VITE_SUPABASE_URL=https://你的项目.supabase.co
VITE_SUPABASE_ANON_KEY=你的 publishable anon key
```

至少选择 Production（建议 Preview 也配置测试环境变量），保存后重新部署。Vite 环境变量在构建时写入前端，**只能放 publishable/anon key，绝不能放 service_role key**。

### 3. 正式上线前检查

- 执行 `npm run check:css`、`npm run lint`、`npm run build`。
- 用真实测试账号验证注册、登录、退出、资料、匹配、心动、消息、动态、图片上传、举报、拉黑、数据导出和注销。
- 用管理员账号验证举报处理、用户审核、验证材料访问和审计记录。
- 在 Supabase 检查 RLS、Storage policy、函数权限、邮箱模板和备份策略。
- 在 Android、iOS、鸿蒙设备分别测试键盘、定位、图片选择、PWA、横竖屏和弱网恢复。

当前仓库已经包含前端与迁移文件，但 Supabase 项目、环境变量、域名回调、SMTP、Storage、RLS 和真实账号测试仍需由项目所有者完成。
