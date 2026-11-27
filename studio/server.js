'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { createJob, retryJob, rebuildJob, deleteJob, listJobs, getJob, readConfig, publicConfig, saveConfig, jobDir, listCovers, setCover, confirmCover, confirmBoard, regenBoard, regenCoverArt, setSceneArtMode } = require('./lib/pipeline');
const { buildChapters } = require('./lib/chapters');
const { listNews, generateTopic } = require('./lib/news');

const PORT = Number(process.env.PORT || 4180);
const HOST = process.env.HOST || '127.0.0.1';
const TOKEN = process.env.STUDIO_TOKEN || '';
const PUBLIC = path.join(__dirname, 'public');

function json(res, code, data) {
  const body = JSON.stringify(data);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function readBody(req, limit = 5 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => {
      data += c;
      if (data.length > limit) { reject(new Error('请求体过大')); req.destroy(); }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch { reject(new Error('请求体不是 JSON')); }
    });
    req.on('error', reject);
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function sendFile(req, res, file, downloadName) {
  if (!fs.existsSync(file)) return json(res, 404, { error: '文件不存在' });
  const stat = fs.statSync(file);
  const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const headers = { 'Content-Type': type, 'Accept-Ranges': 'bytes' };
  if (downloadName) headers['Content-Disposition'] = `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`;

  const range = req.headers.range;
  if (range && /^bytes=\d*-\d*$/.test(range)) {
    const [s, e] = range.replace('bytes=', '').split('-');
    const start = s ? Number(s) : 0;
    const end = e ? Number(e) : stat.size - 1;
    if (start >= stat.size) {
      res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
      return res.end();
    }
    res.writeHead(206, {
      ...headers, 'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Content-Length': end - start + 1,
    });
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { ...headers, 'Content-Length': stat.size });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const p = decodeURIComponent(url.pathname);
  try {
    if (TOKEN) {
      const fromQuery = url.searchParams.get('token') === TOKEN;
      const fromHeader = req.headers['x-studio-token'] === TOKEN;
      const fromCookie = (req.headers.cookie || '').split(/;\s*/).includes('studio_token=' + TOKEN);
      if (fromQuery) res.setHeader('Set-Cookie', 'studio_token=' + TOKEN + '; Path=/; HttpOnly; SameSite=Lax');
      if (!fromQuery && !fromHeader && !fromCookie) {
        res.writeHead(401, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end('<meta charset="utf-8"><p style="font-family:sans-serif;padding:24px">需要访问口令：在地址后加 <code>?token=你的口令</code></p>');
      }
    }

    if (p === '/api/health') return json(res, 200, { ok: true });

    if (p === '/api/news' && req.method === 'GET') {
      const data = await listNews(url.searchParams.get('refresh') === '1');
      return json(res, 200, { updatedAt: data.at, items: data.items, errors: data.errors });
    }

    if (p === '/api/news/topic' && req.method === 'POST') {
      const body = await readBody(req, 256 * 1024);
      const items = Array.isArray(body.items) ? body.items.slice(0, 8) : [];
      if (!items.length) return json(res, 400, { error: '请先选择快讯' });
      const channel = ['财经', '科技', '体育'].includes(body.channel) ? body.channel : '财经';
      const topic = await generateTopic(items, readConfig(), channel);
      return json(res, 200, topic);
    }

    if (p === '/api/config' && req.method === 'GET') return json(res, 200, publicConfig());

    if (p === '/api/config' && req.method === 'POST') {
      const body = await readBody(req);
      const next = {};
      if (typeof body.baseUrl === 'string') next.baseUrl = body.baseUrl.trim();
      if (typeof body.model === 'string') next.model = body.model.trim();
      if (typeof body.apiKey === 'string' && body.apiKey.trim() && !body.apiKey.includes('****')) next.apiKey = body.apiKey.trim();
      if (body.clearKey) next.apiKey = '';
      if (['svg', 'pollinations', 'openai'].includes(body.artProvider)) next.artProvider = body.artProvider;
      if (['library', 'svg', 'api'].includes(body.sceneArtMode)) next.sceneArtMode = body.sceneArtMode;
      if (['rough', 'marker', 'ink', 'blueprint', 'retro'].includes(body.artStyle)) next.artStyle = body.artStyle;
      if (typeof body.artBaseUrl === 'string') next.artBaseUrl = body.artBaseUrl.trim();
      if (typeof body.artModel === 'string') next.artModel = body.artModel.trim();
      if (typeof body.artSize === 'string' && body.artSize.trim()) next.artSize = body.artSize.trim();
      if (typeof body.artApiKey === 'string' && body.artApiKey.trim() && !body.artApiKey.includes('****')) next.artApiKey = body.artApiKey.trim();
      if (body.clearArtKey) next.artApiKey = '';
      saveConfig(next);
      return json(res, 200, publicConfig());
    }

    if (p === '/api/jobs' && req.method === 'GET') return json(res, 200, listJobs());

    if (p === '/api/jobs' && req.method === 'POST') {
      const body = await readBody(req);
      if (!body.title || !String(body.title).trim()) return json(res, 400, { error: '请填写标题' });
      if (!body.summary || !String(body.summary).trim()) return json(res, 400, { error: '请填写一句话介绍' });
      const dup = listJobs().find(j => j.brief && j.brief.title === String(body.title).trim() && (j.status === 'running' || j.status === 'queued' || j.status === 'board' || j.status === 'preview'));
      if (dup) return json(res, 409, { error: '已有相同标题的任务在排队或生成中，请等待完成' });
      let board = null;
      if (body.storyboard) {
        board = typeof body.storyboard === 'string' ? JSON.parse(body.storyboard) : body.storyboard;
      }
      const job = createJob(body, board);
      return json(res, 201, { id: job.id });
    }

    const rt = p.match(/^\/api\/jobs\/([\w-]+)\/retry$/);
    if (rt && req.method === 'POST') {
      const j = retryJob(rt[1]);
      if (!j) return json(res, 404, { error: '任务不存在' });
      return json(res, 200, { id: j.id });
    }

    const rb = p.match(/^\/api\/jobs\/([\w-]+)\/rebuild$/);
    if (rb && req.method === 'POST') {
      const src = getJob(rb[1]);
      if (!src) return json(res, 404, { error: '任务不存在' });
      if (src.status === 'running' || src.status === 'queued') return json(res, 409, { error: '这条任务还在生成中，完成后再重新生成' });
      const j = rebuildJob(rb[1]);
      if (!j) return json(res, 404, { error: '任务不存在' });
      return json(res, 201, { id: j.id });
    }

    const coverList = p.match(/^\/api\/jobs\/([\w-]+)\/covers$/);
    if (coverList && req.method === 'GET') {
      const r = await listCovers(coverList[1], url.searchParams.get('page') || 0);
      if (!r.ok) return json(res, r.code, { error: r.error });
      return json(res, 200, r);
    }

    const coverSet = p.match(/^\/api\/jobs\/([\w-]+)\/cover$/);
    if (coverSet && req.method === 'POST') {
      const body = await readBody(req, 64 * 1024);
      const r = await setCover(coverSet[1], String(body.motif || ''), body.layout);
      if (!r.ok) return json(res, r.code, { error: r.error });
      return json(res, 200, r);
    }

    const coverArt = p.match(/^\/api\/jobs\/([\w-]+)\/art$/);
    if (coverArt && req.method === 'POST') {
      const body = await readBody(req);
      const r = await regenCoverArt(coverArt[1], body.provider, body.prompt, body.style);
      if (!r.ok) return json(res, r.code, { error: r.error });
      return json(res, 200, r);
    }

    const sceneArt = p.match(/^\/api\/jobs\/([\w-]+)\/illus$/);
    if (sceneArt && req.method === 'POST') {
      const body = await readBody(req, 64 * 1024);
      const r = setSceneArtMode(sceneArt[1], body.mode, body.style);
      if (!r.ok) return json(res, r.code, { error: r.error });
      return json(res, 200, r);
    }

    const boardOk = p.match(/^\/api\/jobs\/([\w-]+)\/board\/confirm$/);
    if (boardOk && req.method === 'POST') {
      const r = confirmBoard(boardOk[1]);
      if (!r.ok) return json(res, r.code, { error: r.error });
      return json(res, 200, r);
    }

    const boardRegen = p.match(/^\/api\/jobs\/([\w-]+)\/board\/regen$/);
    if (boardRegen && req.method === 'POST') {
      const body = await readBody(req, 64 * 1024);
      const r = regenBoard(boardRegen[1], String(body.note || '').trim().slice(0, 200));
      if (!r.ok) return json(res, r.code, { error: r.error });
      return json(res, 200, r);
    }

    const coverOk = p.match(/^\/api\/jobs\/([\w-]+)\/confirm$/);
    if (coverOk && req.method === 'POST') {
      const r = confirmCover(coverOk[1]);
      if (!r.ok) return json(res, r.code, { error: r.error });
      return json(res, 200, r);
    }

    const delJob = p.match(/^\/api\/jobs\/([\w-]+)$/);
    if (delJob && req.method === 'DELETE') {
      const r = deleteJob(delJob[1]);
      if (!r.ok) return json(res, r.code, { error: r.error });
      return json(res, 200, { ok: true });
    }

    const m = p.match(/^\/api\/jobs\/([\w-]+)(?:\/(script|storyboard))?$/);
    if (m && req.method === 'GET') {
      const id = m[1];
      if (!getJob(id)) return json(res, 404, { error: '任务不存在' });
      if (m[2] === 'script') return sendFile(req, res, path.join(jobDir(id), 'script.md'));
      if (m[2] === 'storyboard') return sendFile(req, res, path.join(jobDir(id), 'storyboard.json'));
      return json(res, 200, getJob(id));
    }

    const chap = p.match(/^\/api\/jobs\/([\w-]+)\/chapters$/);
    if (chap && req.method === 'GET') {
      const id = chap[1];
      const job = getJob(id);
      if (!job) return json(res, 404, { error: '任务不存在' });
      let r;
      try {
        r = await buildChapters(jobDir(id), readConfig(), m => console.log(`[${id}] ${m}`));
      } catch (e) {
        return json(res, 400, { error: e.message || '文案生成失败' });
      }
      const name = (job.brief.title || 'video').replace(/[\\/:*?"<>|]/g, '').slice(0, 40) + '-章节文案.txt';
      return sendFile(req, res, path.join(jobDir(id), 'chapters.txt'),
        url.searchParams.get('download') === '1' ? name : undefined);
    }

    const dl = p.match(/^\/api\/jobs\/([\w-]+)\/download$/);
    if (dl) {
      const id = dl[1];
      if (!getJob(id)) return json(res, 404, { error: '任务不存在' });
      const title = (getJob(id).brief.title || 'video').slice(0, 40);
      return sendFile(req, res, path.join(jobDir(id), 'output.mp4'), title + '.mp4');
    }

    const media = p.match(/^\/media\/([\w-]+)\/(output\.mp4|covers\/[\w.-]+\.png|covers\/preview\.png)$/);
    if (media && getJob(media[1])) {
      const target = path.resolve(jobDir(media[1]), media[2]);
      if (!target.startsWith(path.resolve(jobDir(media[1])))) return json(res, 403, { error: '非法路径' });
      return sendFile(req, res, target);
    }

    // 静态资源
    let file = path.join(PUBLIC, p === '/' ? 'index.html' : p);
    if (!file.startsWith(PUBLIC)) return json(res, 403, { error: '非法路径' });
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) return json(res, 404, { error: 'Not found' });
    return sendFile(req, res, file);
  } catch (e) {
    json(res, 500, { error: e && e.message ? e.message : '服务器错误' });
  }
});

server.listen(PORT, HOST, () => {
  const host = HOST === '0.0.0.0' ? 'localhost' : HOST;
  console.log(`手绘财经视频工坊  http://${host}:${PORT}`);
  if (HOST === '0.0.0.0') console.log('已监听全部网卡，局域网请用本机 IP:端口访问；建议同时设置 STUDIO_TOKEN');
});
