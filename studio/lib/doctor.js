'use strict';
// 环境自检：Node / Chrome / ffmpeg / Python / edge-tts / puppeteer-core
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { findChrome, findFfmpeg, findPython, buildEnv } = require('./platform');

const ROOT = path.resolve(__dirname, '../..');
const DATA = path.join(__dirname, '../data');
const fails = [];

function exec(cmd, args) {
  return execFileSync(cmd, args, {
    env: buildEnv(),
    encoding: 'utf8',
    timeout: 20000,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function mark(ok, name, detail) {
  console.log(`${ok ? '[ OK ]' : '[FAIL]'} ${name}${detail ? '  ' + detail : ''}`);
  if (!ok) fails.push(name);
}

function check(name, fn) {
  try {
    mark(true, name, fn());
  } catch (e) {
    const msg = String(e.stderr || e.message || e).split('\n')[0].slice(0, 200);
    mark(false, name, msg);
  }
}

const major = Number(process.versions.node.split('.')[0]);
if (major >= 18) mark(true, 'Node.js', process.version);
else mark(false, 'Node.js', `${process.version} 版本过低，需要 18 及以上`);

check('Chrome', () => {
  const p = findChrome();
  if (!p) throw new Error('未找到 Chrome，请安装或设置 CHROME_PATH');
  return p;
});

check('ffmpeg', () => {
  const p = findFfmpeg();
  const out = exec(p, ['-version']);
  return `${p}\n         ${out.split('\n')[0]}`;
});

check('Python', () => {
  const p = findPython();
  const v = exec(p, ['-c', 'import sys;print(sys.version.split()[0])']);
  return `${p} (${v})`;
});

check('edge-tts', () => {
  // 与 tts.py 的查找顺序一致：项目虚拟环境 → PATH
  for (const p of [path.join(ROOT, '.venv/bin/edge-tts'), path.join(ROOT, '.venv/Scripts/edge-tts.exe')]) {
    if (fs.existsSync(p)) return p;
  }
  const p = findPython();
  try {
    const pyDir = exec(p, ['-c', 'import sys,os;print(os.path.dirname(sys.executable))']);
    for (const c of ['edge-tts', 'edge-tts.exe', 'Scripts/edge-tts.exe']) {
      const full = path.join(pyDir, c);
      if (fs.existsSync(full)) return full;
    }
  } catch { }
  try {
    const v = exec(p, ['-c', 'import edge_tts;print(getattr(edge_tts,"__version__","?"))']);
    return `Python 模块，版本 ${v}`;
  } catch { }
  try {
    exec('edge-tts', ['--version']);
    return 'PATH 中的 edge-tts';
  } catch { }
  throw new Error('未安装，请执行 pip install edge-tts');
});

check('puppeteer-core', () => {
  return require.resolve('puppeteer-core', { paths: [ROOT] });
});

check('任务目录可写', () => {
  fs.mkdirSync(DATA, { recursive: true });
  const probe = path.join(DATA, '.doctor-probe');
  fs.writeFileSync(probe, 'ok');
  fs.unlinkSync(probe);
  return DATA;
});

console.log('');
if (fails.length) {
  console.log(`自检未通过：${fails.join('、')}`);
  console.log('按上面的提示补齐依赖后，重新运行本检查。');
  process.exit(1);
}
console.log('自检通过，可以启动服务。');
