// 聊天 Worker 端点（非机密；可用环境变量 PUBLIC_CHAT_ENDPOINT 覆盖）
export const CHAT_ENDPOINT =
  import.meta.env.PUBLIC_CHAT_ENDPOINT ??
  'https://deepseek-chat-proxy.wyh-sz2516001.workers.dev';

// 前端硬编码回退列表（Worker GET /models 失败时使用）
export const FALLBACK_MODELS = ['deepseek-v4-flash', 'deepseek-v4-pro'];
export const EFFORTS = ['off', 'low', 'high', 'max'] as const;
