ffmpeg -i sbj_0.mp4 -vf "scale=trunc(iw/25)*2:trunc(ih/25)*2" -r 2 -map 0 -map -0:a out.mp4
