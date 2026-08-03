/**
 * DeepSeek 聊天代理 Worker
 * - 非敏感配置：从公开仓库 raw 拉取 settings.json（CMS 后台可编辑，60s 缓存）
 * - 敏感 key：KV（CHAT_CONFIG）存 DEEPSEEK_API_KEY，POST /admin/key 更新（管理密码保护）
 * - 模型/思考档位白名单 + 每 IP 限流，防滥用刷余额
 * - SSE 流式透传，不缓冲
 */

import { getSettings, mergeSettings } from './settings';
import { checkRateLimit, type KVLike } from './rate-limit';
import { handleAdminKey, handleKeyStatus } from './admin';

export interface Env {
  DEEPSEEK_API_KEY?: string;
  ADMIN_PASSWORD?: string;
  MODEL_WHITELIST?: string;
  MAX_OUTPUT_TOKENS?: string;
  CHAT_CONFIG?: KVLike;
  RATE_LIMITER?: {
    limit: (opts: { key: string }) => Promise<{ success: boolean }>;
  };
}

const UPSTREAM = 'https://api.deepseek.com/chat/completions';

const ALLOWED_ORIGINS = new Set([
  'https://youhuiwang.github.io',
  'http://localhost:4321',
  'http://localhost:4322',
  'http://localhost:4323',
]);

function corsHeaders(origin: string | null) {
  const headers: Record<string, string> = {};
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'content-type, x-admin-password';
    headers['Vary'] = 'Origin';
  }
  return headers;
}

function json(data: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders(origin) },
  });
}

function clientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP') ?? 'unknown';
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const cors = corsHeaders(origin);
    const url = new URL(request.url);
    const ip = clientIp(request);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // 管理端点：API key 状态（公开）
    if (request.method === 'GET' && url.pathname === '/admin/key-status') {
      const body = await handleKeyStatus(env.CHAT_CONFIG);
      return new Response(body.body, {
        status: body.status,
        headers: { ...cors, 'content-type': 'application/json' },
      });
    }

    // 管理端点：更新 API key（密码保护）
    if (request.method === 'POST' && url.pathname === '/admin/key') {
      const result = await handleAdminKey(
        request,
        env.CHAT_CONFIG,
        env.ADMIN_PASSWORD,
        env.RATE_LIMITER,
        ip,
      );
      const { status } = result;
      return new Response(result.body, {
        status,
        headers: { ...cors, 'content-type': 'application/json' },
      });
    }

    // 模型与配置（前端选择器数据源，settings 驱动）
    if (request.method === 'GET' && url.pathname === '/models') {
      const cfg = mergeSettings(await getSettings());
      return json(
        {
          models: cfg.models,
          efforts: cfg.efforts,
          defaultModel: cfg.defaultModel,
          defaultEffort: cfg.defaultEffort,
          maxOutputTokens: cfg.maxOutputTokens,
          welcome: cfg.welcome,
        },
        200,
        origin,
      );
    }

    if (request.method !== 'POST' || url.pathname !== '/chat/completions') {
      return json({ error: 'not found' }, 404, origin);
    }

    const cfg = mergeSettings(await getSettings());

    let body: any;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'invalid json' }, 400, origin);
    }

    // 白名单校验（settings → vars → 内置默认）
    const model = body.model;
    const effort = body.reasoning_effort ?? cfg.defaultEffort;

    if (!cfg.models.includes(model)) {
      return json({ error: 'model not allowed' }, 403, origin);
    }
    if (!cfg.efforts.includes(effort)) {
      return json({ error: 'invalid reasoning effort' }, 400, origin);
    }

    // key 回退链：KV → secret → 500
    const kvKey = env.CHAT_CONFIG ? await env.CHAT_CONFIG.get('DEEPSEEK_API_KEY') : null;
    const apiKey = kvKey ?? env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return json({ error: 'server not configured' }, 500, origin);
    }

    // 限流（settings 驱动，KV 计数器优先）
    const ok = await checkRateLimit(
      env.CHAT_CONFIG,
      env.RATE_LIMITER,
      ip,
      cfg.rateLimit.limit,
      cfg.rateLimit.periodSeconds,
    );
    if (!ok) {
      return json({ error: 'rate limited' }, 429, origin);
    }

    // 重组 payload：固定流式；思考关闭/开启由 effort 决定；剥掉无效参数
    const payload: Record<string, unknown> = {
      model,
      messages: Array.isArray(body.messages) ? body.messages.slice(-50) : [],
      stream: true,
      max_tokens: cfg.maxOutputTokens,
      stream_options: { include_usage: true },
      thinking:
        effort === 'off'
          ? { type: 'disabled' }
          : { type: 'enabled', reasoning_effort: effort },
    };

    const upstream = await fetch(UPSTREAM, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    // 原样透传 SSE 流（含状态码）；错误体也透传
    const upstreamHeaders = new Headers({
      ...cors,
      'cache-control': 'no-store',
    });
    if (upstream.status === 200) {
      upstreamHeaders.set(
        'content-type',
        upstream.headers.get('content-type') ?? 'text/event-stream',
      );
    } else {
      upstreamHeaders.set('content-type', 'application/json');
    }
    return new Response(upstream.body, { status: upstream.status, headers: upstreamHeaders });
  },
};
