/**
 * DeepSeek 聊天代理 Worker
 * - key 存于 secret（DEEPSEEK_API_KEY），永不暴露给浏览器
 * - 模型/思考档位白名单 + 每 IP 限流，防滥用刷余额
 * - SSE 流式透传，不缓冲
 */

export interface Env {
  DEEPSEEK_API_KEY?: string;
  MODEL_WHITELIST?: string;
  MAX_OUTPUT_TOKENS?: string;
  RATE_LIMITER?: {
    limit: (opts: { key: string }) => Promise<{ success: boolean }>;
  };
}

const UPSTREAM = 'https://api.deepseek.com/chat/completions';
const EFFORTS = ['off', 'low', 'high', 'max'] as const;

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
    headers['Access-Control-Allow-Headers'] = 'content-type';
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const cors = corsHeaders(origin);
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // 模型与思考档位列表（前端选择器数据源）
    if (request.method === 'GET' && url.pathname === '/models') {
      const models = (env.MODEL_WHITELIST ?? 'deepseek-v4-flash')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      return json({ models, efforts: EFFORTS }, 200, origin);
    }

    if (request.method !== 'POST' || url.pathname !== '/chat/completions') {
      return json({ error: 'not found' }, 404, origin);
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'invalid json' }, 400, origin);
    }

    // 白名单校验（不依赖 key，优先于配置检查）
    const models = (env.MODEL_WHITELIST ?? 'deepseek-v4-flash')
      .split(',')
      .map((s) => s.trim());
    const model = body.model;
    const effort = body.reasoning_effort ?? 'high';

    if (!models.includes(model)) {
      return json({ error: 'model not allowed' }, 403, origin);
    }
    if (!(EFFORTS as readonly string[]).includes(effort)) {
      return json({ error: 'invalid reasoning effort' }, 400, origin);
    }

    const apiKey = env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return json({ error: 'server not configured' }, 500, origin);
    }

    // 限流（绑定缺失时降级跳过）
    if (env.RATE_LIMITER) {
      const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
      const result = await env.RATE_LIMITER.limit({ key: ip });
      if (!result.success) {
        return json({ error: 'rate limited' }, 429, origin);
      }
    }

    const maxTokens = Math.min(
      parseInt(env.MAX_OUTPUT_TOKENS ?? '4096', 10) || 4096,
      8192,
    );

    // 重组 payload：固定流式；思考关闭/开启由前端 effort 决定；剥掉思考模式下无效参数
    const payload: Record<string, unknown> = {
      model,
      messages: Array.isArray(body.messages) ? body.messages.slice(-50) : [],
      stream: true,
      max_tokens: maxTokens,
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

    // 原样透传 SSE 流（含状态码）；错误体也透传给前端做文案映射
    const upstreamHeaders = new Headers({
      ...cors,
      'cache-control': 'no-store',
    });
    if (upstream.status === 200) {
      upstreamHeaders.set('content-type', upstream.headers.get('content-type') ?? 'text/event-stream');
    } else {
      upstreamHeaders.set('content-type', 'application/json');
    }
    return new Response(upstream.body, { status: upstream.status, headers: upstreamHeaders });
  },
};
