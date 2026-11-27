'use strict';
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { generateStoryboard } = require('./llm');
const { validate, CHARS_PER_SEC, GAP_PER_SCENE } = require('./prompt');
const { renderHTML, COVER_STYLES, COVER_LABEL, COVER_LAYOUT_NAME, coverTheme, chooseCover } = require('./template');
const covers = require('./covers');
const { generateCoverArt, normalizeProvider, PROVIDER_LABEL, generateSceneArts, normalizeSceneMode, SCENE_MODE_LABEL, sceneArtStat, normalizeStyle, STYLE_LABEL, STYLE_KEYS } = require('./artgen');
const { buildChapters } = require('./chapters');
const { findFfmpeg, findPython, buildEnv } = require('./platform');

const ROOT = path.resolve(__dirname, '../..');
const DATA = path.join(__dirname, '../data');
const JOBS = path.join(DATA, 'jobs');
const CONFIG = path.join(DATA, 'config.json');

fs.mkdirSync(JOBS, { recursive: true });

/* ---------------- 配置 ---------------- */
function readConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG, 'utf8')); } catch { return {}; }
}
function saveConfig(next) {
  const cur = readConfig();
  const merged = { ...cur, ...next };
  fs.writeFileSync(CONFIG, JSON.stringify(merged, null, 2));
  return merged;
}
function publicConfig() {
  const c = readConfig();
  return {
    baseUrl: c.baseUrl || '',
    model: c.model || '',
    hasKey: !!c.apiKey,
    keyMask: c.apiKey ? c.apiKey.slice(0, 4) + '****' + c.apiKey.slice(-4) : '',
    artProvider: normalizeProvider(c.artProvider),
    artBaseUrl: c.artBaseUrl || '',
    artModel: c.artModel || '',
    artSize: c.artSize || '1024x1024',
    hasArtKey: !!c.artApiKey,
    artKeyMask: c.artApiKey ? c.artApiKey.slice(0, 4) + '****' + c.artApiKey.slice(-4) : '',
    sceneArtMode: normalizeSceneMode(c.sceneArtMode),
    artStyle: normalizeStyle(c.artStyle),
    artStyleLabel: STYLE_LABEL[normalizeStyle(c.artStyle)],
  };
}

/* ---------------- 工具 ---------------- */
function run(cmd, args, opts = {}, onLine = () => {}) {
  return new Promise((resolve, reject) => {
    const env = buildEnv(opts.env || {});
    const child = spawn(cmd, args, { ...opts, env });
    let buf = '';
    const pipe = (stream, isErr) => {
      stream.setEncoding('utf8');
      stream.on('data', chunk => {
        buf += chunk.replace(/\r/g, '\n');
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) if (line.trim()) onLine(line.trim(), isErr);
      });
    };
    pipe(child.stdout, false);
    pipe(child.stderr, true);
    child.on('error', reject);
    child.on('close', code => {
      if (buf.trim()) onLine(buf.trim(), false);
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(cmd)} 退出码 ${code}`));
    });
  });
}

function mb(n) { return (n / 1024 / 1024).toFixed(0) + 'MB'; }

/* ---------------- 任务 ---------------- */
const jobs = new Map();
const queue = [];
let running = false;

function jobDir(id) { return path.join(JOBS, id); }

// 最近几条已生成片子实际使用的封面主体，用于新片避开重复（目录名按日期前缀，字典序即时间序）
function recentCoverIds(excludeId, n = 6) {
  const out = [];
  let ids;
  try { ids = fs.readdirSync(JOBS).sort().reverse(); } catch { return out; }
  for (const id of ids) {
    if (id === excludeId) continue;
    try {
      const b = JSON.parse(fs.readFileSync(path.join(JOBS, id, 'storyboard.json'), 'utf8'));
      const c = b && b.meta && b.meta.cover;
      if (COVER_LABEL[c]) out.push(c);
    } catch { }
    if (out.length >= n) break;
  }
  return out;
}

// 给封面插画补充内容线索：取前几屏标题，避免只凭标题猜画面
function artContext(board) {
  return (board.scenes || [])
    .filter(s => s && s.kind !== 'cover' && s.kind !== 'end')
    .slice(0, 6)
    .map(s => [s.title, s.sub].filter(Boolean).join(' '))
    .filter(Boolean)
    .join('；');
}

function newId() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' +
    Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 5);
}

function log(job, msg) {
  const item = { t: Date.now(), msg: String(msg).slice(0, 500) };
  job.log.push(item);
  if (job.log.length > 500) job.log.splice(0, job.log.length - 500);
  try { fs.appendFileSync(path.join(jobDir(job.id), 'job.log'), `[${new Date(item.t).toISOString()}] ${item.msg}\n`); } catch { }
}

function persist(job) {
  const state = {
    id: job.id, createdAt: job.createdAt, status: job.status, step: job.step,
    progress: job.progress, error: job.error || null,
    coverAt: job.coverAt || null,
    brief: job.brief, title: job.brief.title, minutes: job.brief.minutes,
  };
  fs.writeFileSync(path.join(jobDir(job.id), 'state.json'), JSON.stringify(state, null, 2));
}

function hydrate() {
  for (const id of fs.readdirSync(JOBS)) {
    const st = path.join(JOBS, id, 'state.json');
    if (!fs.existsSync(st)) continue;
    try {
      const s = JSON.parse(fs.readFileSync(st, 'utf8'));
      jobs.set(id, {
        ...s,
        log: [],
        status: s.status === 'running' || s.status === 'queued' ? 'error' : s.status,
        error: s.status === 'running' || s.status === 'queued' ? '服务重启，任务中断' : s.error,
      });
    } catch { }
  }
}
hydrate();

function createJob(brief, storyboard) {
  const id = newId();
  const dir = jobDir(id);
  fs.mkdirSync(dir, { recursive: true });
  const job = {
    id, createdAt: Date.now(), status: 'queued', step: '排队中', progress: 0,
    brief: {
      title: String(brief.title || '').trim(),
      summary: String(brief.summary || '').trim(),
      requirements: String(brief.requirements || '').trim(),
      channel: ['财经', '科技', '体育'].includes(brief.channel) ? brief.channel : '财经',
      minutes: Math.min(10, Math.max(2, Number(brief.minutes) || 5)),
    },
    log: [], error: null,
  };
  if (storyboard) fs.writeFileSync(path.join(dir, 'storyboard.json'), JSON.stringify(storyboard, null, 2));
  fs.writeFileSync(path.join(dir, 'brief.json'), JSON.stringify(job.brief, null, 2));
  jobs.set(id, job);
  persist(job);
  queue.push(job);
  setImmediate(drain);
  return job;
}

function retryJob(id) {
  const job = jobs.get(id);
  if (!job) return null;
  if (job.status === 'running' || job.status === 'queued') return job;
  job.status = 'queued';
  job.step = '排队中';
  job.progress = 0;
  job.error = null;
  job.log = [];
  try { fs.rmSync(path.join(jobDir(id), 'frames'), { recursive: true, force: true }); } catch { }
  persist(job);
  queue.push(job);
  setImmediate(drain);
  return job;
}

// 用同一个选题重新生成一条新任务，旧任务与成片保留
function rebuildJob(id) {
  const src = jobs.get(id);
  if (!src) return null;
  return createJob({ ...src.brief });
}

async function drain() {
  if (running) return;
  running = true;
  while (queue.length) {
    const job = queue.shift();
    try {
      await runJob(job);
      if (job.status === 'preview' || job.status === 'board') { persist(job); continue; }
      job.status = 'done'; job.step = '完成'; job.progress = 100;
      log(job, '成片完成');
    } catch (e) {
      job.status = 'error';
      job.error = e && e.message ? e.message : String(e);
      log(job, '任务失败：' + job.error);
    }
    persist(job);
  }
  running = false;
}

function setStep(job, step, progress) {
  job.step = step;
  if (progress != null) job.progress = progress;
  log(job, `== ${step}`);
  persist(job);
}

async function runJob(job) {
  const dir = jobDir(job.id);
  job.status = 'running';
  persist(job);
  const boardPath = path.join(dir, 'storyboard.json');

  /* 1. 分镜 */
  let board;
  if (fs.existsSync(boardPath)) {
    setStep(job, '读取已有分镜', 8);
    board = validate(JSON.parse(fs.readFileSync(boardPath, 'utf8')));
  } else {
    setStep(job, '生成分镜', 2);
    const config = readConfig();
    board = await generateStoryboard(job.brief, config, m => log(job, m));
    const scenes = board.scenes;
    log(job, `分镜 ${scenes.length} 屏，预估 ${(scenes.reduce((a, s) => a + s.narration.length / CHARS_PER_SEC + GAP_PER_SCENE, 0) / 60).toFixed(1)} 分钟`);
    if (scenes.length < 10) throw new Error('分镜屏数过少，请重试或更换模型');
  }
  fs.writeFileSync(boardPath, JSON.stringify(board, null, 2));
  const est = board.scenes.reduce((a, s) => a + s.narration.length / CHARS_PER_SEC + GAP_PER_SCENE, 0);
  const target = (job.brief.minutes || 5) * 60;
  if (est < target * 0.72 || est > target * 1.18) {
    log(job, `注意：按旁白估算 ${(est / 60).toFixed(1)} 分钟，与目标 ${job.brief.minutes} 分钟偏差较大，成片时长可能不符`);
  }
  job.progress = 10;
  persist(job);

  /* 1.5 分镜确认：先给用户看要点，满意了再做封面 */
  if (!board.meta.boardConfirmed && !board.meta.coverConfirmed) {
    job.status = 'board';
    job.step = '等待确认分镜要点';
    job.progress = 10;
    persist(job);
    log(job, `分镜要点已生成，共 ${board.scenes.length} 屏，请确认或让 AI 重新生成`);
    return;
  }

  /* 2. 封面预览：等用户挑选确认后再继续；固定模式自动确认直接出片 */
  const skipCover = !!board.meta.skipCoverConfirm;
  if (!board.meta.coverConfirmed) {
    const modelPick = COVER_LABEL[board.meta.cover] ? board.meta.cover : undefined;
    // 按标题实物选封面，并避开最近几条片子用过的主体
    const { motif, shifted, from } = chooseCover(board.meta.title, board.meta.subtitle, modelPick, recentCoverIds(job.id));
    if (shifted) log(job, `封面「${COVER_LABEL[from]}」与最近视频重复，按标题自动换成「${COVER_LABEL[motif]}」`);
    const picked = Number(board.meta.coverLayout);
    const layout = (picked === 0 || picked === 1 || picked === 2) ? picked : (board.meta.title.length + board.scenes.length) % 3;
    board.meta.cover = motif;
    board.meta.coverLayout = layout;

    // 先按标题画一张专属插画；画不出来就退回手绘素材，不阻塞流程
    const cfg = readConfig();
    const provider = normalizeProvider(board.meta.artProvider || cfg.artProvider);
    if (!board.meta.artMode && !board.meta.artFailed) {
      setStep(job, '按标题生成封面插画（' + PROVIDER_LABEL[provider] + '）', 10);
      try {
        await generateCoverArt(dir, board.meta, cfg, m => log(job, m), {
          provider, context: artContext(board),
        });
        board.meta.artProvider = provider;
        board.meta.artMode = true;
      } catch (e) {
        board.meta.artFailed = true;
        log(job, '按标题生成插画失败，改用手绘素材封面：' + e.message);
      }
    }
    fs.writeFileSync(boardPath, JSON.stringify(board, null, 2));

    setStep(job, '生成封面预览', 10);
    try {
      await covers.renderPreview(dir, board, motif, layout);
    } catch (e) {
      throw new Error('封面预览渲染失败：' + e.message);
    }
    log(job, board.meta.artMode
      ? `封面插画：已按标题「${board.meta.title}」用${PROVIDER_LABEL[normalizeProvider(board.meta.artProvider)]}生成 · ${COVER_LAYOUT_NAME[layout]}`
      : `封面样式：${COVER_LABEL[motif]} · ${COVER_LAYOUT_NAME[layout]}（共 ${COVER_STYLES.length} 种可选）`);

    if (skipCover) {
      board.meta.coverConfirmed = true;
      fs.writeFileSync(boardPath, JSON.stringify(board, null, 2));
      log(job, '固定模式：数据已确认，封面自动通过，直接出片');
    } else {
      job.status = 'preview';
      job.step = '等待确认封面';
      job.progress = 10;
      job.coverAt = Date.now();
      persist(job);
      log(job, '请确认封面，确认后开始配音与渲染');
      return;
    }
  }
  if (!skipCover) log(job, '封面已确认，继续生成');

  /* 2.5 分镜插图：按选择的方式逐屏生成，失败的单屏退回素材图 */
  const sceneCfg = readConfig();
  const sceneMode = normalizeSceneMode(board.meta.sceneArtMode || sceneCfg.sceneArtMode);
  if (sceneMode !== 'library') {
    board.meta.sceneArtMode = sceneMode;
    setStep(job, '逐屏生成插图（' + SCENE_MODE_LABEL[sceneMode] + '）', 11);
    try {
      await generateSceneArts(dir, board, sceneCfg, m => log(job, m), {
        mode: sceneMode, provider: normalizeProvider(sceneCfg.artProvider),
        onProgress: (done, total) => {
          job.step = `逐屏生成插图 ${done}/${total}`;
          persist(job);
        },
      });
    } catch (e) {
      log(job, '逐屏生成插图失败，改用手绘素材：' + e.message);
    }
    fs.writeFileSync(boardPath, JSON.stringify(board, null, 2));
  }

  /* 3. 配音 */
  setStep(job, '生成配音', 12);
  try {
    await run(findPython(), [path.join(__dirname, 'tts.py'), '--job', dir],
      { cwd: ROOT, env: { PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } },
      line => {
        if (line.startsWith('TTS ')) {
          const [a, b] = line.slice(4).split('/').map(Number);
          job.progress = 12 + Math.round(a / b * 18);
        }
        if (line.startsWith('TOTAL=')) log(job, '配音总长 ' + line.slice(6));
        else log(job, line);
      });
  } catch (e) {
    const fail = [...job.log].reverse().find(l => l.msg.startsWith('TTS_FAIL'));
    throw new Error(fail ? '配音失败：' + fail.msg.replace(/^TTS_FAIL\s*/, '') : e.message);
  }
  const beats = JSON.parse(fs.readFileSync(path.join(dir, 'beats.json'), 'utf8'));
  job.progress = 30;
  persist(job);

  /* 3. 合成页面 */
  setStep(job, '合成手绘页面', 32);
  const html = renderHTML(covers.withSceneArt(dir, covers.withArt(dir, board)), beats.beats);
  const htmlPath = path.join(dir, 'index.html');
  fs.writeFileSync(htmlPath, html);
  log(job, `页面 ${(html.length / 1024).toFixed(0)}KB，${beats.beats.length} 屏`);

  /* 4. 渲染帧 */
  setStep(job, '渲染帧（约 ' + Math.round(beats.total * 30) + ' 帧）', 35);
  const framesDir = path.join(dir, 'frames');
  const t0 = Date.now();
  await run(process.execPath, [path.join(__dirname, 'record-job.js')], {
    cwd: ROOT,
    env: {
      ...process.env,
      HTML: htmlPath, DIR: framesDir, TOTAL: String(beats.total),
      FPS: '30', START: '0', COUNT: '0', PREFIX: 'frame',
    },
  }, line => {
    if (line.startsWith('PROGRESS ')) {
      const m = line.match(/PROGRESS (\d+)\/(\d+)\s*(\d+)ms/);
      if (m) {
        job.progress = 35 + Math.round(Number(m[1]) / Number(m[2]) * 48);
        if (Number(m[1]) % 300 < 50) log(job, `渲染 ${m[1]}/${m[2]} 帧`);
      }
    } else if (line.startsWith('RENDER_FAIL')) {
      log(job, line);
    } else {
      log(job, line);
    }
  });
  log(job, `帧渲染用时 ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  job.progress = 84;
  persist(job);

  /* 5. 编码 */
  setStep(job, '编码成片', 85);
  const mp4 = path.join(dir, 'output.mp4');
  await run(findFfmpeg(), [
    '-y', '-framerate', '30', '-i', path.join(framesDir, 'frame_%05d.jpg'),
    '-i', path.join(dir, 'audio', 'narration.wav'),
    '-vf', 'pad=1080:1920:0:96:black,scale=in_range=full:out_range=tv',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-color_range', 'tv',
    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', mp4,
  ], { cwd: ROOT }, line => {
    if (line.includes('frame=')) {
      const m = line.match(/frame=\s*(\d+)/);
      if (m) job.progress = 85 + Math.round(Number(m[1]) / Math.round(beats.total * 30) * 14);
    }
  });
  job.progress = 99;
  persist(job);

  const size = fs.statSync(mp4).size;
  log(job, `成片 ${mb(size)}，${Math.floor(beats.total / 60)}:${String(Math.round(beats.total % 60)).padStart(2, '0')}`);

  /* 6. 发布文案与章节（失败不影响成片） */
  try {
    const r = await buildChapters(dir, readConfig(), m => log(job, m));
    log(job, (r.cached ? '发布文案已存在：' : '发布文案已生成：') + 'chapters.txt');
  } catch (e) {
    log(job, '发布文案生成失败（不影响成片）：' + e.message);
  }

  /* 7. 清理帧，节省磁盘 */
  try {
    fs.rmSync(framesDir, { recursive: true, force: true });
    log(job, '已清理临时帧');
  } catch { }
}

function readBoard(dir) {
  try { return JSON.parse(fs.readFileSync(path.join(dir, 'storyboard.json'), 'utf8')); } catch { return null; }
}

/* 列出某页封面样式缩略图（24 个/页，磁盘缓存） */
async function listCovers(id, page = 0, size = 24) {
  const job = jobs.get(id);
  if (!job) return { code: 404, error: '任务不存在' };
  const dir = jobDir(id);
  const board = readBoard(dir);
  if (!board) return { code: 400, error: '分镜还没生成，暂时不能预览封面' };
  const pages = Math.ceil(COVER_STYLES.length / size);
  const pg = Math.min(Math.max(0, Number(page) || 0), pages - 1);
  const slice = COVER_STYLES.slice(pg * size, pg * size + size);
  try {
    const files = await covers.renderThumbs(dir, board, slice);
    return {
      ok: true, total: COVER_STYLES.length, pages, page: pg,
      items: slice.map((s, i) => ({ ...s, url: '/media/' + id + '/' + files[i] })),
    };
  } catch (e) {
    return { code: 500, error: '封面缩略图渲染失败：' + e.message };
  }
}

async function setCover(id, motif, layout) {
  const job = jobs.get(id);
  if (!job) return { code: 404, error: '任务不存在' };
  if (job.status !== 'preview') return { code: 409, error: '只有等待确认封面的任务可以换封面' };
  if (!COVER_LABEL[motif]) return { code: 400, error: '未知封面样式' };
  const lay = Number(layout);
  if (!(lay === 0 || lay === 1 || lay === 2)) return { code: 400, error: '封面版式无效' };
  const dir = jobDir(id);
  const board = readBoard(dir);
  if (!board) return { code: 400, error: '分镜文件缺失' };
  const changed = board.meta.cover !== motif;
  board.meta.cover = motif;
  board.meta.coverLayout = lay;
  // 手动挑素材封面就退出插画模式
  board.meta.artMode = false;
  // 小道具是按模型原本选的主体配的，换主体后只保留数字/地名批注
  if (changed && board.meta.coverSpec) {
    const calls = board.meta.coverSpec.callouts;
    if (calls && calls.length) board.meta.coverSpec = { callouts: calls };
    else delete board.meta.coverSpec;
  }
  fs.writeFileSync(path.join(dir, 'storyboard.json'), JSON.stringify(board, null, 2));
  try {
    await covers.renderPreview(dir, board, motif, lay);
  } catch (e) {
    return { code: 500, error: '封面预览渲染失败：' + e.message };
  }
  job.coverAt = Date.now();
  persist(job);
  log(job, `封面改为：${COVER_LABEL[motif]} · ${COVER_LAYOUT_NAME[lay]}`);
  return { ok: true, coverAt: job.coverAt };
}

/* 按标题重画一张封面插画，覆盖上一张；可指定生成方式和自定义提示词 */
async function regenCoverArt(id, provider, prompt, style) {
  const job = jobs.get(id);
  if (!job) return { code: 404, error: '任务不存在' };
  if (job.status !== 'preview') return { code: 409, error: '只有等待确认封面的任务可以重画插画' };
  const dir = jobDir(id);
  const board = readBoard(dir);
  if (!board) return { code: 400, error: '分镜文件缺失' };
  const cfg = readConfig();
  const p = normalizeProvider(provider || board.meta.artProvider || cfg.artProvider);
  const text = prompt === undefined ? undefined : String(prompt || '').trim().slice(0, 400);
  if (STYLE_KEYS.includes(style)) board.meta.artStyle = normalizeStyle(style);
  log(job, '按标题重画封面插画（' + PROVIDER_LABEL[p] + '）' + (text ? '，使用自定义提示词' : ''));
  try {
    await generateCoverArt(dir, board.meta, cfg, m => log(job, m), {
      provider: p, prompt: text, context: artContext(board),
    });
  } catch (e) {
    return { code: 500, error: '生成插画失败：' + e.message };
  }
  board.meta.artMode = true;
  board.meta.artProvider = p;
  if (text !== undefined) {
    if (text) board.meta.artPrompt = text;
    else delete board.meta.artPrompt;
  }
  delete board.meta.artFailed;
  fs.writeFileSync(path.join(dir, 'storyboard.json'), JSON.stringify(board, null, 2));
  try {
    await covers.renderPreview(dir, board, board.meta.cover, board.meta.coverLayout);
  } catch (e) {
    return { code: 500, error: '封面预览渲染失败：' + e.message };
  }
  job.coverAt = Date.now();
  persist(job);
  log(job, '封面插画已重画');
  return { ok: true, coverAt: job.coverAt };
}

/* 封面预览阶段选择整片的分镜插图模式与手绘风格，确认封面后按它生成 */
function setSceneArtMode(id, mode, style) {
  const job = jobs.get(id);
  if (!job) return { code: 404, error: '任务不存在' };
  if (job.status !== 'preview') return { code: 409, error: '只有等待确认封面的任务可以修改插图设置' };
  const dir = jobDir(id);
  const board = readBoard(dir);
  if (!board) return { code: 400, error: '分镜文件缺失' };

  const hasMode = ['library', 'svg', 'api'].includes(mode);
  const hasStyle = STYLE_KEYS.includes(style);
  if (!hasMode && !hasStyle) return { code: 400, error: '没有可保存的插图设置' };

  if (hasMode) board.meta.sceneArtMode = normalizeSceneMode(mode);
  if (hasStyle) board.meta.artStyle = normalizeStyle(style);
  fs.writeFileSync(path.join(dir, 'storyboard.json'), JSON.stringify(board, null, 2));

  const savedMode = board.meta.sceneArtMode ? normalizeSceneMode(board.meta.sceneArtMode) : '';
  const savedStyle = board.meta.artStyle ? normalizeStyle(board.meta.artStyle) : '';
  const bits = [];
  if (hasMode) bits.push('分镜插图模式改为：' + SCENE_MODE_LABEL[savedMode]);
  if (hasStyle) bits.push('手绘风格改为：' + STYLE_LABEL[savedStyle]);
  log(job, bits.join('，'));
  persist(job);
  return {
    ok: true,
    mode: savedMode, modeLabel: savedMode ? SCENE_MODE_LABEL[savedMode] : '',
    style: savedStyle, styleLabel: savedStyle ? STYLE_LABEL[savedStyle] : '',
  };
}

function confirmBoard(id) {
  const job = jobs.get(id);
  if (!job) return { code: 404, error: '任务不存在' };
  if (job.status !== 'board') return { code: 409, error: '任务当前不在等待分镜确认' };
  const dir = jobDir(id);
  const board = readBoard(dir);
  if (!board) return { code: 400, error: '分镜文件缺失' };
  board.meta.boardConfirmed = true;
  fs.writeFileSync(path.join(dir, 'storyboard.json'), JSON.stringify(board, null, 2));
  job.status = 'queued';
  job.step = '排队中';
  job.error = null;
  log(job, '分镜要点已确认，开始生成封面');
  persist(job);
  queue.push(job);
  setImmediate(drain);
  return { ok: true };
}

/* 按用户修改意见重写分镜，完成后回到「等待确认分镜」 */
function regenBoard(id, note) {
  const job = jobs.get(id);
  if (!job) return { code: 404, error: '任务不存在' };
  if (job.status !== 'board') return { code: 409, error: '只有等待确认分镜的任务可以重新生成' };
  const dir = jobDir(id);
  job.status = 'running';
  job.step = '重新生成分镜要点';
  job.progress = 5;
  job.error = null;
  log(job, '重新生成分镜' + (note ? '，修改意见：' + note : ''));
  persist(job);
  (async () => {
    try {
      const cfg = readConfig();
      const brief = { ...job.brief };
      if (note) brief.requirements = [job.brief.requirements, '用户对上一版分镜的修改意见：' + note].filter(Boolean).join('\n');
      const board = await generateStoryboard(brief, cfg, m => log(job, m));
      board.meta.boardConfirmed = false;
      delete board.meta.coverConfirmed;
      fs.writeFileSync(path.join(dir, 'storyboard.json'), JSON.stringify(board, null, 2));
      try { fs.rmSync(path.join(dir, 'covers'), { recursive: true, force: true }); } catch { }
      job.status = 'board';
      job.step = '等待确认分镜要点';
      job.progress = 10;
      log(job, `分镜已重新生成，共 ${board.scenes.length} 屏，请确认`);
    } catch (e) {
      job.status = 'board';
      job.step = '等待确认分镜要点';
      job.error = '重新生成分镜失败：' + (e && e.message ? e.message : String(e));
      log(job, job.error);
    }
    persist(job);
  })();
  return { ok: true };
}

function confirmCover(id) {
  const job = jobs.get(id);
  if (!job) return { code: 404, error: '任务不存在' };
  if (job.status !== 'preview') return { code: 409, error: '任务当前不在等待封面确认' };
  const dir = jobDir(id);
  const board = readBoard(dir);
  if (!board) return { code: 400, error: '分镜文件缺失' };
  board.meta.boardConfirmed = true;
  board.meta.coverConfirmed = true;
  fs.writeFileSync(path.join(dir, 'storyboard.json'), JSON.stringify(board, null, 2));
  job.status = 'queued';
  job.step = '排队中';
  job.error = null;
  log(job, '封面已确认，排队继续生成');
  persist(job);
  queue.push(job);
  setImmediate(drain);
  return { ok: true };
}

function jobView(job, withLog = true) {
  const dir = jobDir(job.id);
  let coverStyle = null;
  const board = readBoard(dir);
  if (board && board.meta && board.meta.cover) {
    const provider = normalizeProvider(board.meta.artProvider);
    coverStyle = {
      motif: board.meta.cover, layout: board.meta.coverLayout,
      art: !!board.meta.artMode,
      provider,
      prompt: board.meta.artPrompt || '',
      label: board.meta.artMode ? ('按标题生成的插画 · ' + PROVIDER_LABEL[provider]) : (COVER_LABEL[board.meta.cover] || board.meta.cover),
      layoutName: COVER_LAYOUT_NAME[board.meta.coverLayout] || '',
    };
  }
  const boardReady = job.status === 'board';
  let boardInfo = null;
  if (boardReady && board && Array.isArray(board.scenes)) {
    boardInfo = {
      title: board.meta.title || job.brief.title,
      subtitle: board.meta.subtitle || '',
      estimate: board.scenes.reduce((a, s) => a + String(s.narration || '').length / CHARS_PER_SEC + GAP_PER_SCENE, 0),
      scenes: board.scenes.map((s, i) => ({
        i: i + 1,
        kind: s.kind || '',
        title: s.title || '',
        sub: s.sub || '',
        narration: s.narration || '',
        points: Array.isArray(s.points) ? s.points.map(p => (p && p.t) || '').filter(Boolean) : [],
      })),
    };
  }
  return {
    id: job.id, createdAt: job.createdAt, status: job.status, step: job.step,
    progress: job.progress, error: job.error || null, brief: job.brief,
    boardReady,
    board: boardInfo,
    preview: job.status === 'preview',
    coverAt: job.coverAt || null,
    hasCover: fs.existsSync(path.join(dir, 'covers', 'preview.png')),
    coverStyle,
    sceneArt: board ? {
      mode: board.meta.sceneArtMode ? normalizeSceneMode(board.meta.sceneArtMode) : '',
      label: board.meta.sceneArtMode ? SCENE_MODE_LABEL[normalizeSceneMode(board.meta.sceneArtMode)] : '',
      style: board.meta.artStyle ? normalizeStyle(board.meta.artStyle) : '',
      styleLabel: board.meta.artStyle ? STYLE_LABEL[normalizeStyle(board.meta.artStyle)] : '',
      ...sceneArtStat(dir, board),
    } : null,
    hasVideo: fs.existsSync(path.join(dir, 'output.mp4')),
    duration: (() => {
      try { return JSON.parse(fs.readFileSync(path.join(dir, 'beats.json'), 'utf8')).total; } catch { return null; }
    })(),
    log: withLog ? job.log.slice(-120) : undefined,
  };
}

function deleteJob(id) {
  const job = jobs.get(id);
  if (!job) return { ok: false, code: 404, error: '任务不存在' };
  if (job.status === 'running' || job.status === 'queued') {
    return { ok: false, code: 409, error: '任务正在生成，暂时不能删除' };
  }
  try {
    fs.rmSync(jobDir(id), { recursive: true, force: true });
  } catch (e) {
    return { ok: false, code: 500, error: '删除文件失败：' + e.message };
  }
  jobs.delete(id);
  return { ok: true };
}

function listJobs() {
  return [...jobs.values()]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 50)
    .map(j => jobView(j, false));
}

function getJob(id) {
  const j = jobs.get(id);
  return j ? jobView(j, true) : null;
}

module.exports = {
  createJob, retryJob, rebuildJob, deleteJob, listJobs, getJob, readConfig, saveConfig, publicConfig, jobDir, JOBS,
  listCovers, setCover, confirmCover, confirmBoard, regenBoard, regenCoverArt, setSceneArtMode,
};
