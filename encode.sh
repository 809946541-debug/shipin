#!/bin/zsh
# 成片规格（固定规则，勿漏）：页面按 1080x1728 渲染，编码时上下各补 96px 黑边 -> 1080x1920，左右不留黑边
# 用法：./encode.sh [输出文件] [旁白 wav]
FF=/opt/homebrew/lib/python3.14/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v9.0
OUT=${1:-guang-module.mp4}
WAV=${2:-audio/guang/narration.wav}
$FF -y -framerate 30 -i frames/%05d.jpg -i "$WAV" \
  -vf "pad=1080:1920:0:96:black,scale=in_range=full:out_range=tv" \
  -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -color_range tv \
  -c:a aac -b:a 192k -movflags +faststart -shortest "$OUT"
