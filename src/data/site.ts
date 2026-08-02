// 站点内容数据 —— 请将占位内容替换为你自己的信息

export interface Profile {
  name: string;
  bio: { zh: string; en: string };
  location: string;
  email: string;
  github: string;
  // 社交链接（可增删）
  socials: { label: string; url: string; icon: string }[];
}

export const profile: Profile = {
  name: 'Youhui Wang',
  bio: {
    zh: '热爱技术的学习者与创作者，专注于软件开发，喜欢把想法变成产品。',
    en: 'A learner and maker who loves technology, focused on software development and turning ideas into products.',
  },
  location: '中国',
  email: 'youhui.wang@example.com',
  github: 'https://github.com/YouhuiWang',
  socials: [
    { label: 'GitHub', url: 'https://github.com/YouhuiWang', icon: 'github' },
    { label: 'Email', url: 'mailto:youhui.wang@example.com', icon: 'mail' },
  ],
};

export interface Project {
  title: { zh: string; en: string };
  description: { zh: string; en: string };
  url: string;
  tags: string[];
}

// 作品集：按时间倒序展示
export const projects: Project[] = [
  {
    title: { zh: '个人网站', en: 'Personal Website' },
    description: {
      zh: '基于 Astro 构建的中英双语个人网站，包含博客、作品集与导航聚合。',
      en: 'A bilingual personal website built with Astro, featuring blog, portfolio and links.',
    },
    url: 'https://github.com/YouhuiWang/personal_page',
    tags: ['Astro', 'TypeScript'],
  },
];

export interface LinkItem {
  label: string;
  description: { zh: string; en: string };
  url: string;
}

// 导航/链接聚合
export const links: LinkItem[] = [
  {
    label: 'GitHub',
    description: {
      zh: '我的代码仓库',
      en: 'My code repositories',
    },
    url: 'https://github.com/YouhuiWang',
  },
];
