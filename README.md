# 手绘风科普视频模板（可复用）

一个纯前端的「手绘纸感 + 手写字 + 线条动画」竖屏视频生产模板。
当前内容是一支 **2 分 02 秒**的 SpaceX 星舰发射回收科普短片（含中文旁白、抖音安全黑边），
但**文案、分镜、画面元素、旁白全部可以替换**，
换成财经、健康、历史、产品介绍等任意主题，产出 1080×1920 / 30fps 的 MP4。

---

## 1. 它是什么

```
文案（HTML 里的 div）  +  画面（JS 生成的 SVG）  +  时间轴（一个数组）
                    ↓
              index.html 浏览器渲染
                    ↓  record.js 逐帧定格 + ffmpeg
              output/xxx.mp4（1080×1920 · 30fps）
```

特点：

- **零依赖**：不联网、不装框架，Chrome 打开就能看。
- **手绘感是算出来的**：所有"手抖"的线都是 `mulberry32` 伪随机 + 折线打散生成的，不是图片素材。
- **完全确定性渲染**：通过 `window.__seek(ms)` 逐帧定格，不受机器性能影响，不会掉帧。
- **改动成本低**：改一句文案 = 改一行 HTML；加一个新分镜 = 复制一个 `<section>` + 一个 IIFE。

---

## 2. 目录

```
shipin/
├── index.html      # 唯一核心文件：舞台、9 个分镜、全部 CSS/JS
├── record.js       # 全片录制：逐帧截图到 frames/，交给 ffmpeg
├── shoot.js        # 单场景静态截图（调试布局用）
├── frames/         # 录制产生的帧序列 00000.jpg ... 03671.jpg（3672 帧）
├── audio/
│   ├── edge2/      # 逐句旁白 s0~s8.mp3 / .wav（edge-tts 生成）
│   └── narration_edge2.wav   # 按时间轴对齐、混好的整轨旁白
├── output/         # 成片 starship.mp4（无声）、starship_voice.mp4（带旁白）、抽帧检查图
├── .venv/          # Python 虚拟环境，装了 edge-tts
└── README.md       # 本文件
```

需要的环境：

- macOS + Google Chrome（路径写在 `record.js` / `shoot.js` 里，换机器要改）
- Node + `puppeteer-core`（已在 `package.json`）
- ffmpeg（本项目用 imageio-ffmpeg 的静态二进制）：
  `/opt/homebrew/lib/python3.14/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v9.0`
- edge-tts（微软神经网络语音，装在项目 `.venv` 里）：
  `python3 -m venv .venv && .venv/bin/pip install edge-tts`，首次使用需联网

---

## 3. 五分钟跑通

```bash
cd /Users/a1/Desktop/project/shipin

# 1) 预览（直接用 Chrome 打开，带自动播放）
open index.html

# 2) 只看第 5 个分镜（筷子回收），定格 8 秒后
open "index.html?scene=s5"

# 3) 某个分镜只要最终态（禁用所有动画），检查排版
open "index.html?scene=s5&still=1"

# 4) 截一张静态图
node shoot.js s3 7000 1080x1920 output/s3.png

# 5) 渲染全片帧（3672 帧，约 3 分钟）
node record.js

# 6) 合成视频：页面里 #safe 已把内容等比缩到 80%（左右是纸纹，不是黑边），
#    这里只补上下各 192px（1/10）黑边，内容一点不裁
FF=/opt/homebrew/lib/python3.14/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v9.0
$FF -y -framerate 30 -i frames/%05d.jpg \
    -vf "drawbox=x=0:y=0:w=1080:h=192:color=black:t=fill,drawbox=x=0:y=1728:w=1080:h=192:color=black:t=fill" \
    -c:v libx264 -pix_fmt yuv420p -crf 18 -preset medium -movflags +faststart output/starship.mp4

# 7) 生成逐句旁白（替换成你的文案，9 段）
.venv/bin/edge-tts --voice zh-CN-YunjianNeural --text "第 1 句旁白" --write-media audio/edge2/s0.mp3
# 转 wav（保留原始尾音，不要 silenceremove 硬裁）
$FF -y -i audio/edge2/s0.mp3 -ar 44100 -ac 2 -c:a pcm_s16le audio/edge2/s0.wav
# 用 afinfo 量出每句实际时长，填进 BEATS

# 8) 混音：offset = 该屏进场秒数 + 0.25s（见 4.5），再压进视频
$FF -y -i output/starship.mp4 -i audio/narration_edge2.wav \
    -c:v copy -c:a aac -b:a 160k -ar 48000 -movflags +faststart output/starship_voice.mp4
```

参数速查：

| 用法 | 含义 |
|---|---|
| `index.html` | 从头自动播放 |
| `?scene=s0`~`s8` | 只激活该分镜，动画从 0 开始跑 |
| `&still=1` | 关掉一切动画/过渡，只看最终排版 |
| `?manual=1` | 不自动播放，等 `window.__start()` |
| `?render=1` | 录制模式，等 `window.__seek(ms)` 驱动 |
| `node record.js` | 渲染全片 3672 帧 |
| `node record.js 900 60` | 只渲染第 900 帧起 60 帧（改完局部快速验证） |

时长换算：`总时长(秒) × 30 = 帧数`。本项目 122.4 × 30 ≈ 3672 帧。

---

## 4. 结构解剖

### 4.1 舞台

```
#stage (1080×1920，用 transform: scale(k) 适配窗口)
├── .tex   纸张噪点纹理（内联 SVG turbulence + 细横纹）
├── .vig   四周暗角（inset box-shadow）
├── defs   #rough / #rough2（线条抖动滤镜）、#hatch / #hatchD（斜线填充）
└── #safe  抖音安全区：transform: scale(.8)，整幅内容缩到 864×1536 居中
    └── section#s0 ... #s8   每个分镜一层，含：
        ├── svg#artN   ← 画面，由 JS 拼装后 setArt 注入
        └── div.n.f    ← 文字，绝对定位
```

- `.scene{opacity:0}`，加 `.on` 后 `opacity:1`，切换时 0.55s 交叉淡入淡出。
- 文字统一用 `.n`（默认 46px）+ 尺寸修饰类 `.sm .md .big .huge .mega`，颜色 `.red`，居中 `.c`。
- `.f` = fade 元素：默认 `opacity:0`，父级 `.on` 后淡入并上移 16px，延迟由 inline `--d` 控制。
- 需要"浅一点"的文字用 `--op:.9`，**不要**写 inline `opacity`（会覆盖过渡，导致它一开场就出现，见第 9 节）。

### 4.2 中文手写字

```css
--hand:"Hanzipen SC","Kaiti SC","STKaiti",cursive;
```

`Hanzipen SC` 是 macOS 自带的汉仪翩翩体，和参考截图几乎一致。
换到 Windows 时把它换成「方正字迹-童体」等手写体，或把 woff2 放到本地并用 `@font-face`。

### 4.3 手绘感怎么来的

| 手法 | 实现 | 位置 |
|---|---|---|
| 线条手抖 | 把线段按 64px 拆点，中间点随机偏移 ±amp | `jitterPts()` |
| 圆不圆 | 18 个半径随机浮动的点连成闭合折线 | `circlePath()` / `circle()` |
| 笔画毛边 | SVG 滤镜 `feTurbulence + feDisplacementMap` | `#rough`(scale 3.2) / `#rough2`(scale 5) |
| 阴影/隔热瓦 | 斜线 `<pattern>` 填充 | `#hatch` / `#hatchD` / `#hatchGlow` |
| 纸张 | 噪点 SVG data-URI + 细横纹 + 径向渐变 + 暗角 | `.tex` / `.vig` / `#stage` 背景 |

同一个种子（`seed`）永远得到同一根线，所以画面稳定可复现。

### 4.4 时间轴

```js
const BEATS = [['s0',0],['s1',12.9],['s2',32.4],['s3',44.2],['s4',57.9],
               ['s5',71.7],['s6',86.2],['s7',101.9],['s8',113.8]];
const TOTAL = 122.4;
```

- 数组 = `[分镜 id, 进场秒数]`，必须按时间升序。
- 分镜内所有动效（CSS keyframes、文字淡入延迟 `--d`）都是**相对该分镜进场时刻**计算的。
- 想加长某个分镜，就改下一个分镜的进场秒数，并同步改 `TOTAL`（`record.js` 里也有一份 `TOTAL`，必须同步）。
- **带旁白时的公式**：`本屏时长 = 0.25s 起口 + 该句语音实测长度 + 3s 呼吸位`，下一屏起点 = 上一屏起点 + 本屏时长。

### 4.5 旁白与抖音安全区

**音色**：微软 edge-tts `zh-CN-YunjianNeural`（云健，男声解说），免费、无需 Key、需联网。
备选：`zh-CN-XiaoxiaoNeural`（女声）、`zh-CN-YunxiNeural`（男声）、`zh-CN-YunyangNeural`（新闻腔）。
列出全部中文音色：`.venv/bin/edge-tts --list-voices | grep zh-CN`

**逐句生成**（文案存在第 5 步，9 句对应 9 个分镜）：

```bash
FF=/opt/homebrew/lib/python3.14/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v9.0
.venv/bin/edge-tts --voice zh-CN-YunjianNeural --rate=+0% \
    --text "先认识一下它。星舰是人类史上最大的火箭……" --write-media audio/edge2/s1.mp3
$FF -y -i audio/edge2/s1.mp3 -ar 44100 -ac 2 -c:a pcm_s16le audio/edge2/s1.wav
afinfo audio/edge2/s1.wav | grep duration       # 量长度，填进 BEATS
```

**不要**对生成的 wav 做 `silenceremove` 裁剪：阈值会连最后一个字的尾音一起切掉，
听感就是"最后一个词突然断"。保留原始尾音，靠 `adelay` 定位即可。

**混整轨**（offset = 该屏进场秒数 + 0.25 秒；本项目为 250 / 13150 / 32650 / 44450 / 58150 / 71950 / 86450 / 102150 / 114050）：

```bash
$FF -y -f lavfi -t 122.4 -i anullsrc=r=44100:cl=stereo \
    -i audio/edge2/s0.wav -i audio/edge2/s1.wav -i audio/edge2/s2.wav \
    -i audio/edge2/s3.wav -i audio/edge2/s4.wav -i audio/edge2/s5.wav \
    -i audio/edge2/s6.wav -i audio/edge2/s7.wav -i audio/edge2/s8.wav \
    -filter_complex "\
      [1:a]adelay=250|250[a0];[2:a]adelay=13150|13150[a1];[3:a]adelay=32650|32650[a2];\
      [4:a]adelay=44450|44450[a3];[5:a]adelay=58150|58150[a4];[6:a]adelay=71950|71950[a5];\
      [7:a]adelay=86450|86450[a6];[8:a]adelay=102150|102150[a7];[9:a]adelay=114050|114050[a8];\
      [0:a][a0][a1][a2][a3][a4][a5][a6][a7][a8]amix=inputs=10:normalize=0,\
      loudnorm=I=-16:TP=-1.5:LRA=9,alimiter=limit=0.891:level=false,aresample=48000,\
      afade=t=out:st=121.9:d=0.5[aout]" \
    -map "[aout]" -c:a pcm_s16le audio/narration_edge2.wav
```

**抖音安全区（重要）**：
- 成片 1080×1920，**上下各 192px（1/10）纯黑**，避开抖音的返回按钮/标题/底部文案。
- **不裁任何内容**：`index.html` 里所有分镜都包在 `#safe` 里，
  `#safe{transform:scale(.8)}` 把整幅 1080×1920 等比缩成 864×1536 并居中，
  纸张背景（`#stage` 背景 + `.tex` + `.vig`）不缩放，所以**左右仍是连续的纸纹，不是黑边**。
- 页面里的文字坐标**照 1080×1920 正常写**，不要为了黑边挪位置；黑边只在 ffmpeg 最后一步用 `drawbox` 盖上。
- 实测校验方法（看每行平均色）：

```bash
for y in 0 191 192 1000 1727 1728 1919; do
  printf "y=%-5s " "$y"
  $FF -v error -ss 20 -i output/starship_voice.mp4 -frames:v 1 \
      -vf "crop=1080:2:0:$y,scale=1:1" -f rawvideo -pix_fmt rgb24 - | od -An -tu1
done
# 0/191/1728/1919 应为 0 0 0；其余应为纸色
```

**音频验收**：`$FF -i output/starship_voice.mp4 -af volumedetect -f null -` 看
`mean_volume ≈ -16 dB`、`max_volume ≤ -1.5 dB`；
`silencedetect=noise=-40dB:d=0.5` 应能在每屏之间看到约 3 秒静音，说明没有串词。

---

## 5. 换主题：五步改造法

### 步骤 1：复制一份

```bash
cp -R /Users/a1/Desktop/project/shipin /Users/a1/Desktop/project/finance-video
cd /Users/a1/Desktop/project/finance-video
rm -rf frames/* output/*
```

### 步骤 2：改文案（最快见效）

文字都在 9 个 `<section>` 里，长这样：

```html
<div class="n big f" style="left:88px;top:400px;--d:.2s">热分离</div>
<div class="n f" style="left:92px;top:512px;--d:.45s;--op:.9">二级点火，一级掉头</div>
```

规则：

- `left/top` 是 1080×1920 画布上的绝对坐标（`top` 是文字块顶部）。
- 画布按完整 1080×1920 设计即可；`#safe` 会在导出时整体缩到 80%，不会裁掉任何内容。
- `--d` = 相对分镜进场的延迟秒数，按你想要的"念白节奏"排。
- 想居中就把 `left` 设成中心 x 并加 `--tx:-50%`。
- 一行字最多约 6~7 个汉字（46px），超了就拆两行。

### 步骤 3：改分镜数量与时长

1. 增删 `<section class="scene" id="sN">`，同时给里面的 svg 一个唯一 id（如 `art9`）。
2. 在 JS 末尾的 `BEATS` 里加一行 `['s9', 47.0]`。
3. 改 `TOTAL`。
4. 每个分镜要有一段拼装代码（见步骤 4），否则 svg 是空的。

### 步骤 4：改画面

每个分镜的 SVG 由一个立即执行函数拼出来：

```js
/* S3 热分离 */
(function(){
  let s = '<g filter="url(#rough)">';
  s += groundLine(40, 1040, 1616, 6);
  s += circle(540, 900, 160, {seed:12, w:4});
  s += arrow(300, 900, 500, 900, {seed:31});
  s += '</g>';
  setArt('art3', s);
})();
```

要点：

- 外层用 `<g filter="url(#rough)">` 统一加手抖毛边。
- 每个元素的 `seed` 换一个数字，避免线条重复。
- **同一个 `<g>` 上不要套两层 `filter:url(#rough)`**，不会叠加，反而会失效。

### 步骤 5：改视觉主题（配色 / 纸张）

只改这三处就能换风格：

```css
:root{ --ink:#2d2822; --ink2:#4b4034; --red:#b23a2a; }
```

```css
#stage{
  background:
    radial-gradient(75% 45% at 20% 4%, rgba(255,252,242,.95), rgba(255,252,242,0) 62%),
    radial-gradient(60% 40% at 82% 88%, rgba(132,100,58,.16), rgba(132,100,58,0) 68%),
    linear-gradient(160deg,#f7efdb 0%,#f0e3c5 42%,#e5d3ae 100%);
}
```

想要"财经蓝黑"就把底改成 `#f2f4f7 → #dfe6ee`，`--ink:#1d2733`，强调色 `--red` 换成金色或深红。
纸张噪点想关掉就把 `.tex` 的 `opacity` 调成 `.18` 或 `0`。

### 步骤 6：渲染

```bash
node record.js                 # 全片
$FF -y -framerate 30 -i frames/%05d.jpg \
    -vf "drawbox=x=0:y=0:w=1080:h=192:color=black:t=fill,drawbox=x=0:y=1728:w=1080:h=192:color=black:t=fill" \
    -c:v libx264 -pix_fmt yuv420p -crf 18 -preset medium -movflags +faststart output/finance.mp4
```

旁白按 4.5 的流程生成、量长、重排 `BEATS`，最后再 `-c:v copy` 把 `audio/narration_xxx.wav` 压进去。

---

## 6. 财经主题示例

### 6.1 八镜脚本（约 45 秒）

| 分镜 | 时长 | 画面 | 台词（屏显） |
|---|---|---|---|
| s0 封面 | 3.4s | 标题 + 一枚硬币 + 折线上升 | 「三分钟看懂：为什么降息，你的房贷会变」 |
| s1 全貌 | 4.6s | 三条线：存款 / 贷款 / 通胀，各自飘着标签 | 「先记住三个数」 |
| s2 变量 | 5.0s | 央行大楼简笔画 + 利率数字盘 | 「利率，就是钱的价格」 |
| s3 传导 | 5.0s | 一条折线从央行连到家庭 | 「降息 → 贷款便宜 → 有人愿意借钱」 |
| s4 结果 | 6.0s | 柱状图两根：旧月供 vs 新月供 | 「30 年房贷，每月少还 400 块」 |
| s5 反例 | 6.0s | 通胀箭头往上窜 | 「但钱变便宜了，物价也会抬头」 |
| s6 结论 | 5.0s | 天平：省钱 vs 贬值 | 「没有白拿的便宜」 |
| s7 收尾 | 4.0s | 一句话 + 订阅引导 | 「看懂钱的流向，再做决定」 |

### 6.2 可以直接加进 `index.html` 的图形组件

把下面几个函数贴在 `/* ================= 绘制部件 ================= */` 区块后面，
就可以在任意分镜里像 `circle()` 一样调用。它们都复用了已有的 `ln()`，风格自动统一。

```js
/* 柱状图：bars = [[x, 高度], ...]，baseY 是基线 */
function barChart(bars, baseY, w, seed) {
  let s = ln([[bars[0][0] - 40, baseY], [bars[bars.length-1][0] + w + 40, baseY]],
             {w:4, seed:seed});
  bars.forEach((b, i) => {
    const x = b[0], h = b[1];
    s += '<path d="' + jitterPts([[x,baseY],[x,baseY-h],[x+w,baseY-h],[x+w,baseY],[x,baseY]],
         1.6, mulberry32(seed + i), false) + '" fill="url(#hatch)" stroke="#2d2822" ' +
         'stroke-width="3" stroke-linejoin="round" opacity=".9"/>';
  });
  return s;
}

/* 折线：pts = [[x,y], ...]，可选节点小圆 */
function lineChart(pts, o) {
  o = o || {};
  let s = ln(pts, {w: o.w || 4, seed: o.seed || 41, c: o.c});
  if (o.dot !== false) {
    pts.forEach((p, i) => { s += circle(p[0], p[1], o.r || 9, {seed: (o.seed || 41) + i, fill:'#f7efdb', w:3}); });
  }
  return s;
}

/* K 线：c = [x, 开盘, 收盘, 最高, 最低] */
function candle(c, seed) {
  const [x, o, cl, hi, lo] = c, up = cl >= o;
  let s = ln([[x, hi], [x, lo]], {w:3, seed:seed});
  const top = Math.min(o, cl), h = Math.max(Math.abs(cl - o), 8);
  s += '<path d="' + jitterPts([[x-14,top],[x-14,top+h],[x+14,top+h],[x+14,top],[x-14,top]],
       1.2, mulberry32(seed+1), false) + '" fill="' + (up ? 'rgba(178,58,42,.18)' : 'url(#hatch)') +
       '" stroke="#2d2822" stroke-width="3" stroke-linejoin="round"/>';
  return s;
}

/* 硬币堆：n 枚，从下往上错开叠 */
function coinStack(cx, baseY, n, r, seed) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const y = baseY - i * r * 0.55;
    s += '<ellipse cx="' + cx + '" cy="' + y + '" rx="' + r + '" ry="' + r * 0.34 +
         '" fill="rgba(246,238,220,.9)" stroke="#2d2822" stroke-width="3"/>';
  }
  return s;
}

/* 大数字标签：数字用超大字号，靠 HTML 层更好读，这里只画圈选线 */
function highlight(cx, cy, rx, ry, seed) {
  return '<path d="' + ellipseJitter(cx, cy, rx, ry, seed) +
         '" fill="none" stroke="#b23a2a" stroke-width="4" stroke-linecap="round" opacity=".85"/>';
}
```

用法示例（放在某个分镜的拼装函数里）：

```js
let s = '<g filter="url(#rough)">';
s += barChart([[300, 260], [560, 190], [820, 320]], 1400, 140, 61);
s += lineChart([[200, 1200], [420, 1080], [640, 1150], [880, 900]], {seed:71});
s += coinStack(880, 1500, 6, 62, 81);
s += highlight(560, 1180, 190, 90, 91);
s += '</g>';
setArt('art4', s);
```

文案配套建议：财经类句子短、带数字，用 `.n.big`（72px）+ `.red` 突出数字，
正文用 46px 加 `--op:.9`，节奏上每个分镜 4~6 秒、每屏 2~4 行字最舒服。

---

## 7. 绘制函数速查

| 函数 | 作用 | 关键参数 |
|---|---|---|
| `jitterPts(pts, amp, rand, close)` | 折线打散成手绘路径 | `amp` 抖动幅度（默认 1.2~1.6） |
| `ln(pts, o)` | 手绘直线/折线 | `w` 线宽, `op` 透明度, `c` 颜色, `dash` 虚线, `seed` |
| `circle(cx,cy,r,o)` | 手绘圆 | `fill`, `w`, `seed`, `amp` |
| `circlePath(cx,cy,r,seed,amp)` | 圆路径字符串 | 需要自己塞进 `<path d>` |
| `arrow(x1,y1,x2,y2,o)` | 箭头 | `curve` 弯度, `head` 箭头长, `w`, `seed` |
| `sparkle(x,y,s,c)` | 四角星闪光 | `s` 半径 |
| `star(x,y,s,c,op)` | 八角星 | — |
| `groundLine(x1,x2,y,seed)` | 地平线 + 短排线 | — |
| `gridFin(x,y,w,h,dir,seed)` | 格栅舵 | `dir` ±1 |
| `engines(cx,baseY,n,w,seed)` | 一排发动机喷口 | `n` 数量 |
| `shipMarkup(w,sh,o)` | 星舰（船体+襟翼+发动机） | `w` 宽, `sh` 高 |
| `boosterMarkup(w,bh,o)` | 助推器 | `w` 宽, `bh` 高 |
| `stackMarkup(w,bh,sh,o)` | 助推器 + 星舰整箭 | — |
| `towerMarkup({x,w,top,bottom,seed})` | 发射塔（桁架） | — |
| `armMarkup(px,py,len,cls,seed)` | 机械臂 | `cls` 传 `'armTop'`/`'armBot'` 才会有夹持动画 |
| `flameMarkup(cx,cy,sc,seed,o)` | 火焰（多层焰舌） | `sc` 横向展开, `o.k` 整体缩放 |
| `puff(cx,cy,r,seed,op)` | 云/烟雾（圆润多边形） | `r` 半径 |
| `ring(cx,cy,rx,ry,seed)` / `ellipseJitter()` | 椭圆（涟漪/轨道） | — |
| `miniRocket(k)` | 小火箭图标 | `k` 缩放 |
| `setArt('art3', s)` | 把拼装的 SVG 串注入对应分镜 | — |
| `markDraw('#art1', base, step, dur)` | 让线条"一笔笔画出来" | `step` 每条线的延迟增量 |

---

## 8. 录制原理（为什么不会掉帧）

浏览器里跑动画再录屏，机器一卡就废。本项目换了个思路：

1. 页面支持 `?render=1`，不自动播放；
2. 外部调用 `window.__seek(t)`，按 `BEATS` 切分镜、加 `.on`；
3. 对该分镜下所有动画（CSS animation + transition）统一执行 `pause()` 再把 `currentTime` 设到 `t - 进场时刻`；
4. 每帧截一张 JPEG 存盘。

因为动画被暂停在指定时刻，截图快慢完全不影响画面内容，30fps 帧序列与实际时间轴严格一一对应。
换机器、换负载，结果都一样。

`record.js` 里改这两行就能换分辨率/帧率：

```js
const FPS = 30;
const TOTAL = 122.4;   // 帧数 = 122.4 × 30 ≈ 3672
```

以及 `page.setViewport({width:1080, height:1920})`。要 4K 就把视口设成 2160×3840（页面会自动缩放，注意文字会显得更细腻但不会变粗）。

---

## 9. 已知坑

1. **不要给文字写 inline `opacity`**
   `.f` 的淡入靠的是 `opacity:0 → var(--op,1)` 的过渡；一旦 inline 写死 `opacity:.9`，
   过渡不会产生，这行字会在分镜一出现时就亮着，打乱节奏。要用 `--op:.9`。

2. **`.still` 模式只能验排版**
   `?still=1` 用 `animation:none!important` 关掉了所有动画，元素会回到 keyframes 之外的初始态。
   想看动画中间帧，用 `node record.js <帧号> 1` 定格。

3. **同一个 `<g>` 不要套两层 `filter:url(#rough)`**
   内层会覆盖外层，效果反而消失。部件函数内部已经带 filter，外层只加 `<g transform>` 即可。

4. **`forwards` 会卡住动画**
   位移类 keyframes 一律用 `both`，否则动画结束后元素会跳回原位（尤其在定格渲染时很明显）。

5. **`groundLine()` 里的短排线用了 `Math.random()`**
   这意味着两次渲染的地面短线会略有不同。要严格可复现，把它换成 `mulberry32(seed)`。

6. **字体只保证 macOS**
   换个系统先跑一遍 `?scene=s0&still=1` 看字形是否对，再开始改内容。

7. **文字压图**
   1080 宽的画布左右两边各留 80px 安全区；长句先量一下：`字数 × 字号 × 1.05` 就是大致宽度。

8. **导出是"缩"不是"裁"**
   抖音版靠 `#safe{transform:scale(.8)}` 把整幅内容缩小，上下再用 `drawbox` 盖 192px 黑边；
   不要直接对帧做 crop（会把标题和落款切掉），也不要给 `#stage` 加黑底（会让左右变黑边）。

9. **旁白尾音不要裁**
   `silenceremove` 会把最后一个字的衰减一起切掉，听起来"最后一个词突然断"。保留原始 wav 的尾巴。

10. **`TOTAL` 有两处**
    `index.html` 和 `record.js` 各有一份，改时间轴必须同时改；否则帧数和音频轨道对不上。

11. **旁白时长决定分镜长度**
    先定文案 → 生成语音 → 量长度 → 再写 `BEATS`。反过来（先定时间再配音）会逼你加速语音，语速就不统一了。

---

## 10. 复用检查清单

- [ ] 复制项目目录，清空 `frames/`、`output/`、`audio/`
- [ ] 改 `:root` 配色 + `#stage` 背景（换主题色）
- [ ] 改每屏文字（`left/top/--d/--op`），画布按完整 1080×1920 设计
- [ ] 写 9 段旁白，`edge-tts` 逐句生成，`afinfo` 量时长
- [ ] 按 `0.25 + 语音 + 3s` 重排 `BEATS`，同步两处 `TOTAL`
- [ ] 增删分镜 `<section>`，每屏的画面元素重排（复用第 7 节函数）
- [ ] `?scene=sN&still=1` 或 `node shoot.js` 逐屏看排版，有遮挡就挪
- [ ] `node record.js <帧号> 1` 抽查每屏的动画中间帧
- [ ] `node record.js` 全片 + ffmpeg 合成（`drawbox` 上下 192px 黑边）
- [ ] `adelay + amix + loudnorm` 混旁白，`-c:v copy` 封装
- [ ] 验收：`volumedetect` 约 -16 LUFS、峰值 ≤ -1.5dB；`silencedetect` 每屏间约 3s 静音
- [ ] 抽帧拼图检查：`$FF -i output/x.mp4 -vf "select='eq(n\,60)+eq(n\,400)',tile=2x1" -frames:v 1 output/sheet.jpg`
