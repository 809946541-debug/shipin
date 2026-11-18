#!/usr/bin/env python3
# 通用配音：分镜旁白 -> 逐句 mp3 -> wav -> 拼接 narration.wav + beats.json
import argparse, json, os, pathlib, shutil, subprocess, sys, time, wave

# Windows 默认按 GBK 读写文件 / 控制台，统一走 UTF-8，避免中文分镜报 UnicodeDecodeError
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

ROOT = pathlib.Path(__file__).resolve().parents[2]
LEAD = 0.3
TAIL = 1.0
SR = 44100


def find_ffmpeg():
    if os.environ.get('FFMPEG_PATH') and pathlib.Path(os.environ['FFMPEG_PATH']).exists():
        return os.environ['FFMPEG_PATH']
    cands = [
        pathlib.Path('/opt/homebrew/lib/python3.14/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v9.0'),
        pathlib.Path('/opt/homebrew/bin/ffmpeg'),
        pathlib.Path('/usr/local/bin/ffmpeg'),
        pathlib.Path('/usr/bin/ffmpeg'),
        pathlib.Path('C:/ffmpeg/bin/ffmpeg.exe'),
        pathlib.Path(os.path.join(os.environ.get('ProgramFiles', 'C:/Program Files'), 'ffmpeg', 'bin', 'ffmpeg.exe')),
    ]
    for p in cands:
        if p.exists():
            return str(p)
    w = shutil.which('ffmpeg')
    if w:
        return w
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass
    raise SystemExit('找不到 ffmpeg，请安装或设置环境变量 FFMPEG_PATH')


def find_edge():
    cands = [ROOT / '.venv/bin/edge-tts', ROOT / '.venv/Scripts/edge-tts.exe']
    # pip 会把可执行文件装到解释器旁边（Windows 在 Scripts 子目录），PATH 里没有时兜底
    if sys.executable:
        py = pathlib.Path(sys.executable).parent
        cands += [py / 'edge-tts', py / 'edge-tts.exe', py / 'Scripts/edge-tts.exe']
    for p in cands:
        if p.exists():
            return str(p)
    w = shutil.which('edge-tts')
    if w:
        return w
    raise SystemExit('找不到 edge-tts，请在项目虚拟环境里安装 edge-tts')


def read_wav(path):
    with wave.open(str(path), 'rb') as w:
        if w.getframerate() != SR or w.getnchannels() != 1 or w.getsampwidth() != 2:
            raise SystemExit('wav 参数不一致：' + str(path))
        return w.readframes(w.getnframes())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--job', required=True)
    ap.add_argument('--voice', default='zh-CN-YunjianNeural')
    ap.add_argument('--rate', default='+12%')
    args = ap.parse_args()

    job = pathlib.Path(args.job)
    board = json.loads((job / 'storyboard.json').read_text(encoding='utf-8'))
    scenes = board['scenes']
    lines = [s.get('narration', '').strip() for s in scenes]
    if any(not t for t in lines):
        raise SystemExit('存在空旁白')

    AD = job / 'audio'
    AD.mkdir(parents=True, exist_ok=True)
    EDGE = find_edge()
    FF = find_ffmpeg()

    (job / 'script.md').write_text(
        '# ' + board['meta'].get('title', '') + '\n\n'
        + '\n'.join(f'旁白：{t}' for t in lines) + '\n',
        encoding='utf-8'
    )

    for i, t in enumerate(lines):
        mp3 = AD / f's{i}.mp3'
        wav = AD / f's{i}.wav'
        ok = False
        last_err = ''
        for attempt in range(6):
            try:
                r = subprocess.run([EDGE, '--voice', args.voice, f'--rate={args.rate}',
                                    '--text', t, '--write-media', str(mp3)],
                                   capture_output=True, text=True,
                                   encoding='utf-8', errors='replace')
                if r.returncode != 0:
                    tail = (r.stderr or r.stdout or '').strip().splitlines()
                    raise RuntimeError(tail[-1] if tail else 'edge-tts 退出码 ' + str(r.returncode))
                if not mp3.exists() or mp3.stat().st_size < 1000:
                    raise RuntimeError('音频为空或过短')
                ok = True
                break
            except Exception as e:
                last_err = str(e)[:240]
                print(f's{i} 重试 {attempt + 1} ... {last_err}', flush=True)
                time.sleep(3 + attempt * 2)
        if not ok:
            print(f'TTS_FAIL s{i} {last_err}', flush=True)
            raise SystemExit(f'第 {i + 1} 句配音失败：{last_err}')
        subprocess.run([FF, '-y', '-i', str(mp3), '-ar', str(SR), '-ac', '1', str(wav)],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(0.2)
        print(f'TTS {i + 1}/{len(lines)}', flush=True)

    lead = b'\x00\x00' * int(LEAD * SR)
    beats, out = [], bytearray()
    for i in range(len(lines)):
        data = read_wav(AD / f's{i}.wav')
        speech = len(data) / 2 / SR
        beats.append({'id': f's{i}', 'dur': round(LEAD + speech + TAIL, 2)})
        out += lead + data + b'\x00\x00' * int(TAIL * SR)

    with wave.open(str(AD / 'narration.wav'), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(bytes(out))

    total = round(sum(b['dur'] for b in beats), 2)
    (job / 'beats.json').write_text(json.dumps({'beats': beats, 'total': total}, ensure_ascii=False, indent=2),
                                    encoding='utf-8')
    print(f'TOTAL={total:.2f}s ({int(total // 60)}:{total % 60:04.1f})', flush=True)


if __name__ == '__main__':
    main()
