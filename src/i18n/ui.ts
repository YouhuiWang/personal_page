export const languages = {
  zh: '中文',
  en: 'English',
} as const;

export const defaultLang = 'zh' as const;

export const ui = {
  zh: {
    'nav.home': '首页',
    'nav.about': '关于',
    'nav.projects': '作品',
    'nav.blog': '博客',
    'nav.links': '导航',
    'footer.rights': '保留所有权利',
    'hero.tagline': '你好，欢迎来到我的个人主页',
    'hero.subtitle': '记录技术、生活与思考',
    'section.latestPosts': '最新文章',
    'section.projects': '精选项目',
    'section.links': '常用链接',
    'blog.all': '全部文章',
    'blog.empty': '还没有文章，敬请期待',
    'blog.back': '返回博客',
    'blog.readMore': '阅读全文',
    'about.title': '关于我',
    'projects.title': '作品集',
    'links.title': '导航与链接',
    'links.desc': '我在各平台的足迹与常用资源',
    'common.viewAll': '查看全部',
  },
  en: {
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.projects': 'Projects',
    'nav.blog': 'Blog',
    'nav.links': 'Links',
    'footer.rights': 'All rights reserved',
    'hero.tagline': 'Hi, welcome to my homepage',
    'hero.subtitle': 'Tech, life, and thoughts',
    'section.latestPosts': 'Latest Posts',
    'section.projects': 'Featured Projects',
    'section.links': 'Useful Links',
    'blog.all': 'All Posts',
    'blog.empty': 'No posts yet, stay tuned',
    'blog.back': 'Back to blog',
    'blog.readMore': 'Read more',
    'about.title': 'About Me',
    'projects.title': 'Projects',
    'links.title': 'Links',
    'links.desc': 'My presence and useful resources',
    'common.viewAll': 'View all',
  },
} as const;

export type UiKey = keyof (typeof ui)[typeof defaultLang];
