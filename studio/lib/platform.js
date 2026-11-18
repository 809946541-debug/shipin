'use strict';
// 跨平台依赖探测：Chrome / ffmpeg / Python，可用环境变量覆盖
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const isWin = process.platform === 'win32';
const isMac = process.platform === 'darwin';

function firstExisting(list) {
  return list.find(p => p && fs.existsSync(p));
}

function findChrome() {
  const env = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
  if (env && fs.existsSync(env)) return env;
  if (isMac) {
    return firstExisting([
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    ]) || null;
  }
  if (isWin) {
    const roots = [
      process.env.PROGRAMFILES,
      process.env['PROGRAMFILES(X86)'],
      process.env.LOCALAPPDATA,
    ].filter(Boolean);
    const rels = [
      'Google\\Chrome\\Application\\chrome.exe',
      'Chromium\\Application\\chrome.exe',
      'Microsoft\\Edge\\Application\\msedge.exe',
    ];
    const cands = [];
    for (const r of roots) for (const rel of rels) cands.push(path.join(r, rel));
    return firstExisting(cands) || null;
  }
  return firstExisting([
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium', '/usr/bin/chromium-browser',
  ]) || null;
}

function findFfmpeg() {
  const env = process.env.FFMPEG_PATH;
  if (env && fs.existsSync(env)) return env;
  if (isMac) {
    return firstExisting([
      '/opt/homebrew/lib/python3.14/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v9.0',
      '/opt/homebrew/bin/ffmpeg',
      '/usr/local/bin/ffmpeg',
    ]) || 'ffmpeg';
  }
  if (isWin) {
    return firstExisting([
      'C:\\ffmpeg\\bin\\ffmpeg.exe',
      path.join(process.env.ProgramFiles || 'C:\\Program Files', 'ffmpeg', 'bin', 'ffmpeg.exe'),
    ]) || 'ffmpeg';
  }
  return firstExisting(['/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg']) || 'ffmpeg';
}

function findPython() {
  const env = process.env.PYTHON_PATH;
  if (env) return env;
  if (isWin) return 'python';
  if (fs.existsSync('/usr/bin/python3')) return '/usr/bin/python3';
  return 'python3';
}

// 补充常见的可执行文件目录，避免子进程里找不到 ffmpeg / node
function buildEnv(extra = {}) {
  const dirs = [];
  if (!isWin) dirs.push('/opt/homebrew/bin', '/usr/local/bin');
  else if (fs.existsSync('C:\\ffmpeg\\bin')) dirs.push('C:\\ffmpeg\\bin');
  const sep = isWin ? ';' : ':';
  const base = { ...process.env };
  // Windows 的 PATH 键名大小写不固定，先清掉再统一写入，避免重复键
  for (const k of Object.keys(base)) if (k.toUpperCase() === 'PATH') delete base[k];
  const PATH = dirs.length ? dirs.join(sep) + sep + process.env.PATH : process.env.PATH;
  return { ...base, PATH, ...extra };
}

function fileUrl(file) {
  return pathToFileURL(path.resolve(file)).href;
}

module.exports = { isWin, isMac, findChrome, findFfmpeg, findPython, buildEnv, fileUrl };
