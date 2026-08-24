# 同频 Supabase 配置

## 1. 创建项目

在 [Supabase](https://supabase.com/dashboard) 创建一个项目。建议开发阶段保留邮箱验证；快速本地测试时可在 Authentication → Providers → Email 临时关闭 Confirm email。

## 2. 创建数据库与权限

打开 SQL Editor，将 `supabase/migrations/202604010001_initial_schema.sql` 的全部内容执行一次。它会创建：

- `profiles`：公开校园资料
- `preferences`：仅本人可见的匹配偏好
- `posts`、`comments`、`post_likes`：校园动态互动
- `post-images` Storage bucket：最多 5 MB 的 JPEG/PNG/WebP/GIF
- 新用户资料触发器与全部 RLS 策略

也可以安装 Supabase CLI 后使用 `supabase db push`。

## 3. 配置前端

复制 `.env.example` 为 `.env.local`，从 Project Settings → API 填入：

```env
VITE_SUPABASE_URL=https://你的项目.supabase.co
VITE_SUPABASE_ANON_KEY=你的匿名公钥
```

只能在前端使用 anon/publishable key，**绝不能写入 service_role key**。

重启开发服务器：

```bash
npm run dev
```

未配置环境变量时应用自动进入演示模式，原有页面和本地临时互动仍可体验。

## 4. 当前安全边界

- 所有社交数据仅允许已登录用户读取。
- 用户只能修改自己的资料、动态、评论和点赞。
- 匹配偏好只有本人能读取和更新。
- 图片只能上传至当前用户 UUID 对应的目录。
- 内容长度、年龄范围、文件类型和文件大小均在数据库或 Storage 层约束。

## 5. 上线前建议

- 配置正式站点 URL 与 Auth Redirect URLs。
- 接入学校邮箱域名白名单或学信/校园身份人工认证。
- 增加举报、拉黑、内容审核、限流和敏感信息检测。
- 将公开图片桶改为受控访问或使用签名 URL，以获得更严格的隐私。
- 使用 Supabase CLI 管理迁移，并从项目生成最新 TypeScript 类型。
