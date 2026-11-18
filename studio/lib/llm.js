'use strict';
const { SYSTEM, buildUserPrompt, validate } = require('./prompt');

function endpoint(baseUrl) {
  const u = String(baseUrl || '').trim().replace(/\/+$/, '');
  if (/\/chat\/completions$/.test(u)) return u;
  return u + '/chat/completions';
}

async function post(config, body, timeoutMs = 240000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (config.apiKey) headers.Authorization = 'Bearer ' + config.apiKey;
    const res = await fetch(endpoint(config.baseUrl), {
      method: 'POST', headers, body: JSON.stringify(body), signal: ctl.signal,
    });
    const text = await res.text();
    if (!res.ok) {
      const err = new Error(`模型接口 ${res.status}: ${text.slice(0, 400)}`);
      err.status = res.status;
      throw err;
    }
    try { return JSON.parse(text); } catch (e) { throw new Error('模型返回不是 JSON：' + text.slice(0, 200)); }
  } finally {
    clearTimeout(timer);
  }
}

async function chat(config, messages, opts = {}) {
  const base = { model: config.model, messages, temperature: opts.temperature == null ? 0.6 : opts.temperature };
  if (opts.json !== false) {
    try {
      const res = await post(config, { ...base, response_format: { type: 'json_object' } });
      return res;
    } catch (e) {
      // 部分兼容服务不支持 response_format，去掉后重试一次
      if (e.status && e.status < 500) {
        const res = await post(config, base);
        return res;
      }
      throw e;
    }
  }
  return post(config, base);
}

function pickText(res) {
  const c = res && res.choices && res.choices[0];
  if (!c) throw new Error('模型返回缺少 choices');
  const msg = c.message || {};
  const t = msg.content;
  if (typeof t === 'string') return t;
  if (Array.isArray(t)) return t.map(x => x.text || '').join('');
  throw new Error('模型返回缺少正文');
}

async function generateStoryboard(brief, config, log = () => {}) {
  if (!config || !config.baseUrl || !config.model) throw new Error('未配置大模型接口');
  const messages = [{ role: 'system', content: SYSTEM }, { role: 'user', content: buildUserPrompt(brief) }];
  log('调用模型生成分镜：' + config.model);
  const res = await chat(config, messages, { temperature: 0.65 });
  const text = pickText(res);
  const usage = res.usage ? `tokens ${res.usage.total_tokens || ''}` : '';
  log('模型返回 ' + text.length + ' 字符 ' + usage);
  try {
    return validate(text);
  } catch (e) {
    log('分镜校验失败，请求模型修正：' + e.message);
    const fix = messages.concat([
      { role: 'assistant', content: text.slice(0, 6000) },
      { role: 'user', content: '上面的 JSON 不合格：' + e.message + '。请严格按给定结构重新输出完整 JSON，不要任何解释文字。' },
    ]);
    const res2 = await chat(config, fix, { temperature: 0.3 });
    return validate(pickText(res2));
  }
}

module.exports = { generateStoryboard, chat, endpoint, pickText };
