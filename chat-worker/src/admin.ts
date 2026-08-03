/**
 * 管理端点：更新 API key（存 KV，不落仓库）
 * POST /admin/key      x-admin-password 头 + { apiKey } body
 * GET  /admin/key-status  公开，返回 configured/updatedAt
 */

import { checkRateLimit, type KVLike, type RateLimiter } from './rate-limit';

const KEY_NAME = 'DEEPSEEK_API_KEY';

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function handleAdminKey(
  request: Request,
  kv: KVLike | undefined,
  envPassword: string | undefined,
  limiter: RateLimiter | undefined,
  ip: string,
): Promise<Response> {
  if (!envPassword) {
    return json({ error: 'admin password not configured' }, 500);
  }
  const password = request.headers.get('x-admin-password') ?? '';
  if (!constantTimeEqual(password, envPassword)) {
    return json({ error: 'unauthorized' }, 401);
  }
  if (!kv) {
    return json({ error: 'kv not configured' }, 500);
  }

  // 防爆破：每 IP 每 60s 5 次
  const ok = await checkRateLimit(kv, limiter, ip, 5, 60, 'admin');
  if (!ok) {
    return json({ error: 'rate limited' }, 429);
  }

  let body: { apiKey?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid json' }, 400);
  }

  const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
  if (!apiKey) {
    return json({ error: 'apiKey is required' }, 400);
  }

  await kv.put(KEY_NAME, apiKey, { metadata: { updatedAt: Date.now() } });
  return json({ ok: true, updatedAt: Date.now() });
}

export async function handleKeyStatus(
  kv: KVLike | undefined,
): Promise<Response> {
  if (!kv) {
    return json({ configured: false, updatedAt: null });
  }
  const { value, metadata } = await kv.getWithMetadata(KEY_NAME);
  const ts = metadata?.updatedAt;
  return json({
    configured: !!value,
    updatedAt: typeof ts === 'number' ? new Date(ts).toISOString() : null,
  });
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
