/**
 * KV 固定窗口限流（settings 可配置）
 * 无 KV 时回退静态 binding；无 binding 时放行
 */

export interface RateLimiter {
  limit: (opts: { key: string }) => Promise<{ success: boolean }>;
}

export interface KVLike {
  get(key: string): Promise<string | null>;
  getWithMetadata(
    key: string,
  ): Promise<{ value: string | null; metadata: Record<string, unknown> | null }>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number; metadata?: Record<string, unknown> },
  ): Promise<void>;
}

export async function checkRateLimit(
  kv: KVLike | undefined,
  fallback: RateLimiter | undefined,
  ip: string,
  limit: number,
  periodSeconds: number,
  prefix = 'rl',
): Promise<boolean> {
  if (kv) {
    const win = Math.floor(Date.now() / 1000 / periodSeconds);
    const key = `${prefix}:${ip}:${win}`;
    const cur = parseInt((await kv.get(key)) ?? '0', 10);
    if (cur >= limit) return false;
    await kv.put(key, String(cur + 1), { expirationTtl: periodSeconds + 10 });
    return true;
  }
  if (fallback) {
    const result = await fallback.limit({ key: ip });
    return result.success;
  }
  return true;
}
