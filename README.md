# 个人网站（Youhui Wang）

基于 [Astro](https://astro.build) 7 构建的中英双语个人网站，静态部署于 GitHub Pages。
杂志纸张风设计（米白纸 / 深墨 / 陶红），支持浅色/暗色/跟随系统三种主题。

- 线上地址：<https://YouhuiWang.github.io/personal_page/>
- 内容后台：<https://YouhuiWang.github.io/personal_page/admin/>

## 🧞 常用命令

| 命令                 | 作用                                   |
| :------------------- | :------------------------------------- |
| `npm install`        | 安装依赖                               |
| `npm run dev`        | 本地开发，访问 `localhost:4321`        |
| `npm run build`      | 构建生产站点到 `./dist/`               |
| `npm run preview`    | 本地预览构建产物                       |
| `npm run check`      | 类型检查                               |

## ✍️ 发布内容（Sveltia CMS 后台）

1. 打开内容后台 <https://YouhuiWang.github.io/personal_page/admin/>
2. 点击 **Sign in with GitHub** → 在 GitHub 授权页点 **Authorize**（第一次登录）
3. 在后台新建/编辑 **博客文章**、**作品**、**链接**、**个人信息**，点保存
4. 保存即自动提交到 GitHub 并触发部署，约 1~2 分钟后线上生效

> 登录通过 [Sveltia CMS Authenticator](https://github.com/sveltia/sveltia-cms-auth)（Cloudflare Workers 免费版）代理 GitHub OAuth。若 OAuth 失效，后台仍可用 **Sign In with Token** 粘贴 PAT 应急（令牌生成方式：GitHub → Settings → Developer settings → Fine-grained tokens，Contents: Read and write，限本仓库）。

### 写文章须知

- 博客文章存放在 `src/content/blog/{zh,en}/`，**中英对照稿用相同文件名**（如 `hello-world.md`），后台会按语言自动关联
- 文章 frontmatter：`title / description / pubDate / tags? / draft?`
- 图片上传到后台后存放在 `public/images/`，在文章中以 `/personal_page/images/xxx.png` 引用

## 🗂 项目结构

```
src/
├── content/
│   ├── blog/{zh,en}/*.md     # 博客文章（双语）
│   ├── profile/profile.yaml  # 个人信息（后台单文件编辑）
│   ├── projects/*.yaml       # 作品集
│   └── links/*.yaml          # 导航链接
├── i18n/{ui.ts, utils.ts}    # UI 文案字典与翻译工具
├── layouts/                  # BaseLayout / BlogPostLayout
├── components/               # Header、Footer、ThemeToggle、卡片等
├── styles/global.css         # 杂志风格设计 token（双主题变量）
└── pages/                    # 页面（zh 无前缀，en 在 /en/ 下）
```

## 🤖 AI 对话（/chat）

- 站点提供 AI 对话页（/chat 与 /en/chat），支持选择模型（deepseek-v4-flash / deepseek-v4-pro）与思考深度（关闭/低/高/最大）
- 请求经 `chat-worker/` 代理（Cloudflare Worker，`deepseek-chat-proxy`）：API key 存 Cloudflare KV/secret，不落浏览器；模型/思考白名单 + 每 IP 限流

### 在后台管理 AI 设置

后台 **/admin/** → "AI 对话设置"（singleton）可在线管理：

- **模型白名单 / 思考档位 / 默认值 / 最大输出 / 限流 / 欢迎语**：保存即生效（约 1 分钟内，Worker 自动拉取），无需重新部署
- **API Key**：在"API Key"字段输入新 key + 管理员密码，点"保存到 Worker"即写入 Cloudflare KV（不会写入仓库文件，始终为掩码）

**一次性初始化**（换 key 之后全部走后台）：

```bash
cd chat-worker
npx wrangler kv namespace create CHAT_CONFIG   # 首次，id 写入 wrangler.toml
echo -n "管理密码" | npx wrangler secret put ADMIN_PASSWORD
echo -n "sk-xxx" | npx wrangler secret put DEEPSEEK_API_KEY   # 兜底 key（KV 未写入前）
```

## 🔄 部署

推送 `main` 分支即触发 [GitHub Actions](.github/workflows/deploy.yml) 自动构建并部署到 GitHub Pages。
