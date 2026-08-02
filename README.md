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
2. 点击 **Sign In with Token**，粘贴 GitHub 访问令牌（PAT）
3. 在后台新建/编辑 **博客文章**、**作品**、**链接**、**个人信息**，点保存
4. 保存即自动提交到 GitHub 并触发部署，约 1~2 分钟后线上生效

### 生成访问令牌（一次性）

GitHub → Settings → **Developer settings** → **Personal access tokens → Fine-grained tokens** → Generate new token：

- Repository access：**Only select repositories** → 选 `YouhuiWang/personal_page`
- Permissions → Repository permissions → **Contents: Read and write**
- 生成后复制，粘贴进后台即可（令牌仅存于你浏览器的 localStorage）

> 令牌泄露可随时在 GitHub 上吊销。若想升级为"点击授权"式登录（GitHub OAuth），可部署 [Sveltia CMS Authenticator](https://github.com/sveltia/sveltia-cms-auth)（Cloudflare Workers 免费版），然后在 `public/admin/config.yml` 的 backend 下加一行 `base_url` 即可。

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

## 🔄 部署

推送 `main` 分支即触发 [GitHub Actions](.github/workflows/deploy.yml) 自动构建并部署到 GitHub Pages。
