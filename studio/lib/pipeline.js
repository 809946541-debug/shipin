'use strict';
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { generateStoryboard } = require('./llm');
const { validate, CHARS_PER_SEC, GAP_PER_SCENE } = require('./prompt');
const { renderHTML } = require('./template');
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

async function drain() {
  if (running) return;
  running = true;
  while (queue.length) {
    const job = queue.shift();
    try {
      await runJob(job);
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

  /* 2. 配音 */
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
  const html = renderHTML(board, beats.beats);
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

  /* 6. 清理帧，节省磁盘 */
  try {
    fs.rmSync(framesDir, { recursive: true, force: true });
    log(job, '已清理临时帧');
  } catch { }
}

function jobView(job, withLog = true) {
  return {
    id: job.id, createdAt: job.createdAt, status: job.status, step: job.step,
    progress: job.progress, error: job.error || null, brief: job.brief,
    hasVideo: fs.existsSync(path.join(jobDir(job.id), 'output.mp4')),
    duration: (() => {
      try { return JSON.parse(fs.readFileSync(path.join(jobDir(job.id), 'beats.json'), 'utf8')).total; } catch { return null; }
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
  createJob, retryJob, deleteJob, listJobs, getJob, readConfig, saveConfig, publicConfig, jobDir, JOBS,
};
