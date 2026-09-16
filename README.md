# 同频 · 真实社交与深度匹配

同频是一个面向成年用户的真实社交与深度匹配 Web 应用:通过引导式资料、深度测评与匹配反馈机制生成真实候选推荐,提供心动配对、私聊、匿名匹配聊天与动态广场,并内置数据导出、注销、举报拉黑等账号与安全能力。前端为 React 单页应用,后端直接使用 Supabase(认证、Postgres、Storage、RLS),无需自建服务端。

## 功能特性

以下能力均可在代码中找到对应实现:

- **资料与画像**:邮箱注册登录、访客年龄确认门槛、引导式创建资料(昵称、出生年份、学校、专业等)、头像上传、资料完成度提示、兴趣标签
- **匹配推荐**:基于真实资料与偏好的候选推荐,提供「为你精选 / 高契合度 / 同校用户」筛选;匹配理由洞察(MatchInsights);SQL 端匹配反馈权重与智能匹配 RPC,可随反馈调优
- **附近的人**:浏览器定位 + 可调半径的发现地图(DiscoveryMap),定位开关与更新时间提示
- **心动与私聊**:心动候选、配对后一对一聊天、删除自己发送的消息、`?matchId=` 深链直达会话
- **匿名匹配聊天**:匿名排队配对,会话 30 分钟过期,支持匿名举报(举报写入为原子操作)
- **同频动态**:发布图文动态、点赞、评论、删除自己的动态、举报他人内容
- **自我探索与复盘**:深度测评流程、自我探索记录与历史、每日复盘、首页每日信号(DailyPulse)与选择罗盘(ChoiceCompass)
- **关系期待与偏好**:关系期待编辑(ExpectationStudio)、偏好趋势展示(PreferenceTrends)
- **会员与候补**:会员中心(MembershipCenter)、候补名单登记(邮箱 + 城市 + 邀请码)
- **账号与数据权利**:个人数据完整导出、账号注销(均限本人操作)
- **安全与治理**:举报、拉黑、隐私协议确认门槛;管理员后台(举报处理、用户审核),仅 `is_admin` 账号可见
- **体验基建**:通知中心、全局搜索(⌘K,搜用户与页面)、深色模式、PWA(manifest + Service Worker,生产环境注册)、弱网/断连提示(ConnectionHealth)、全局错误边界
- **演示模式**:未配置 Supabase 时以演示数据完整运行,并明确标注「演示数据,不代表真实用户或附近位置」

## 快速开始

要求 Node 22+(与 CI 一致)。

```bash
npm install
cp .env.example .env.local   # 可选:填入 Supabase 配置;不配置则以演示模式运行
npm run dev
```

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | 类型检查(`tsc -b`)并构建到 `dist/` |
| `npm run preview` | 本地预览构建产物 |
| `npm run lint` | oxlint 静态检查 |
| `npm run test` | 源码冒烟检查:用 `node:assert` 断言关键逻辑与 CI 配置存在,**不是**单元测试套件 |
| `npm run check:css` | 校验 `src/` 下所有 CSS 文件花括号配对 |

## 后端配置(Supabase)

页面显示「Supabase 尚未配置」或进入演示模式,是因为构建时没有读取 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_ANON_KEY`。它们必须在部署平台的构建环境中配置,不能只配置在本地电脑。

1. 在 Supabase 创建项目。
2. 在 SQL Editor 中按顺序执行 `supabase/migrations/` 下的 36 个 SQL 迁移;生产项目建议使用 Supabase CLI 管理迁移。
3. 在 Auth → URL Configuration 中,将正式站点加入 Site URL 和 Redirect URLs,例如 `https://campus-soul.vercel.app/**` 与 `https://wjh941.github.io/campus-soul/**`。
4. 创建并检查迁移所需的 Storage bucket(头像、动态图片、验证材料),确认 Storage RLS 只允许本人写入、授权用户读取。
5. Auth 邮件服务使用正式 SMTP;开发阶段默认邮件服务有发送频率限制。
6. 从 Project Settings → API 复制 Project URL 和 publishable/anon key,填入 `.env.local`(本地开发)或部署平台环境变量。

```text
VITE_SUPABASE_URL=https://你的项目.supabase.co
VITE_SUPABASE_ANON_KEY=你的 publishable anon key
```

Vite 环境变量在构建时写入前端,**只能放 publishable/anon key,绝不能放 service_role key**。敏感数据隔离依赖数据库端 RLS,而非前端。

## 技术栈与架构

- **前端**:React 19 + TypeScript + Vite,framer-motion 做动效,lucide-react 图标
- **后端**:Supabase(认证、Postgres、Storage、Realtime);前端通过 `src/lib/` 中的模块封装数据访问与 RPC 调用,`database.types.ts` 以 Supabase `Database` 类型定义全部表结构
- **路由**:单页应用,`App.tsx` 内以 `history.pushState` + `?view=` 查询参数管理 14 个视图(发现、匹配、动态、匿名、消息、会员、账号、数据、后台等),支持浏览器前进后退
- **数据库**:36 个 SQL 迁移覆盖表结构、RLS 策略、Storage 策略与 RPC(匹配、匿名会话、举报、数据导出等)
- **PWA**:`public/` 下的 manifest、Service Worker 与图标;移动端、平板、桌面有专门适配样式

## 部署

### Vercel

`vercel.json` 已配置 SPA 重写、安全响应头(CSP、`X-Content-Type-Options` 等)与静态资源长缓存。在项目 Settings → Environment Variables 添加上表两个变量(至少 Production,建议 Preview 也配置),保存后重新部署。

### GitHub Pages

`.github/workflows/deploy-pages.yml` 在 push 到 `main` 时自动:跑 `test`、`lint`、`check:css` → 以 `--base=/campus-soul/` 构建 → 校验产物 → 部署 Pages。环境变量来自仓库 Secrets。部署地址形如 `https://wjh941.github.io/campus-soul/`。

### 正式上线前检查

- 执行 `npm run check:css`、`npm run lint`、`npm run build`。
- 用真实测试账号验证注册、登录、退出、资料、匹配、心动、消息、动态、图片上传、举报、拉黑、数据导出和注销。
- 用管理员账号验证举报处理、用户审核、验证材料访问和审计记录。
- 在 Supabase 检查 RLS、Storage policy、函数权限、邮箱模板和备份策略。
- 在 Android、iOS、鸿蒙设备分别测试键盘、定位、图片选择、PWA、横竖屏和弱网恢复。

## 已知边界与说明

- **没有自动化测试套件**:`npm run test` 只是对源码与 CI 配置的少量正则冒烟断言,不能替代端到端验证。
- 前端主体集中在单个 `App.tsx`(约 74 KB,长行压缩风格)与 `main.tsx` 统一导入的 50 余个按迭代叠加的 CSS 文件中,通读和改动时建议配合格式化工具。
- 当前仓库包含前端与迁移文件,但 Supabase 项目、环境变量、域名回调、SMTP、Storage、RLS 与真实账号测试仍需由部署者自行完成。
- 演示数据为上海校园场景示例,不代表真实用户或附近位置。

## 相关文档

- [SUPABASE_SETUP.md](SUPABASE_SETUP.md) — Supabase 配置说明
- [docs/同频上线与运营执行指南.md](docs/同频上线与运营执行指南.md) — 上线与运营执行指南
