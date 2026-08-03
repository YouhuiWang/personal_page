/**
 * 站点配置热更新：从公开仓库 raw 拉取 settings.json（CMS 可编辑）
 * 60s 内存缓存；失败回退 wrangler vars → 内置默认
 */

export interface ChatSettings {
  chatEnabled: boolean;
  models: string[];
  efforts: string[];
  defaultModel: string;
  defaultEffort: string;
  maxOutputTokens: number;
  rateLimit: { limit: number; periodSeconds: number };
  welcome: { zh: string; en: string };
}

const SETTINGS_URL =
  'https://raw.githubusercontent.com/YouhuiWang/personal_page/main/src/content/chat-settings/settings.json';
const TTL_MS = 60_000;

const DEFAULTS: ChatSettings = {
  chatEnabled: true,
  models: ['deepseek-v4-flash', 'deepseek-v4-pro'],
  efforts: ['off', 'low', 'high', 'max'],
  defaultModel: 'deepseek-v4-flash',
  defaultEffort: 'high',
  maxOutputTokens: 4096,
  rateLimit: { limit: 6, periodSeconds: 60 },
  welcome: { zh: '', en: '' },
};

let cache: { data: Partial<ChatSettings> | null; at: number } | null = null;

export async function getSettings(): Promise<Partial<ChatSettings>> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) {
    return cache.data ?? {};
  }
  try {
    const res = await fetch(SETTINGS_URL);
    if (res.ok) {
      const data = (await res.json()) as Partial<ChatSettings>;
      if (data && Array.isArray(data.models) && data.models.length) {
        cache = { data, at: now };
        return data;
      }
    }
  } catch {
    // 网络失败：继续走回退
  }
  // 失败也缓存 60s，避免每次请求都打 raw
  cache = { data: null, at: now };
  return {};
}

export function mergeSettings(s: Partial<ChatSettings>): ChatSettings {
  return {
    chatEnabled: typeof s.chatEnabled === 'boolean' ? s.chatEnabled : DEFAULTS.chatEnabled,
    models: Array.isArray(s.models) && s.models.length ? s.models : DEFAULTS.models,
    efforts: Array.isArray(s.efforts) && s.efforts.length ? s.efforts : DEFAULTS.efforts,
    defaultModel:
      typeof s.defaultModel === 'string' && s.defaultModel ? s.defaultModel : DEFAULTS.defaultModel,
    defaultEffort:
      typeof s.defaultEffort === 'string' && s.defaultEffort
        ? s.defaultEffort
        : DEFAULTS.defaultEffort,
    maxOutputTokens:
      typeof s.maxOutputTokens === 'number' && s.maxOutputTokens > 0
        ? Math.min(s.maxOutputTokens, 8192)
        : DEFAULTS.maxOutputTokens,
    rateLimit:
      s.rateLimit && typeof s.rateLimit.limit === 'number' && s.rateLimit.limit > 0
        ? {
            limit: s.rateLimit.limit,
            periodSeconds:
              typeof s.rateLimit.periodSeconds === 'number' && s.rateLimit.periodSeconds > 0
                ? s.rateLimit.periodSeconds
                : DEFAULTS.rateLimit.periodSeconds,
          }
        : DEFAULTS.rateLimit,
    welcome:
      s.welcome && typeof s.welcome === 'object'
        ? { zh: s.welcome.zh ?? '', en: s.welcome.en ?? '' }
        : DEFAULTS.welcome,
  };
}
