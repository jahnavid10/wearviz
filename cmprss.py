#!/usr/bin/env python3
import sys,csv
import numpy as np
from subprocess import Popen, PIPE

subj = str(0)

# compres CSV file into a js-friendly low-res compression
with open('sbj_'+subj+'.csv') as f:
	reader = csv.reader(f, delimiter = ',')
	adata = list(reader)

print(adata[0])

# arbitrarily skipped datapoints and quantization, just to test
skipSize = 10; quant = 10

acc = np.zeros([12,int(len(adata)/skipSize)+1])
i=0
for row in adata[1:-1:skipSize]:
	for sensor in range(0,12):
		acc[sensor][i] = (float(row[sensor+1])*quant)
		offset = (quant*16)-(quant*4)
		if sensor in [0,1,2]: acc[sensor][i] += offset  # right arm
		elif sensor in [6,7,8]: acc[sensor][i] -= 2*offset  # left leg
		elif sensor in [3,4,5]: acc[sensor][i] -= offset  # right leg
	i+=1

with open('dta'+subj+'.js',"w") as f:
	i=0
	for sensor in ["raX","raY","raZ","laX","laY","laZ","rlX","rlY","rlZ","llX","llY","llZ"]:
		f.write("var "+sensor+"=[")
		f.write(",".join( list( map (str, [int(x) for x in acc[i][:] ]) ) ) )
		f.write("];\n")
		i+=1

exit(0)  # stop for now

# compress the original raw video into a 2Hz low-res video for quick access:
# e.g.: subj_0.mp4  is changed into s0.mp4
s = "ffmpeg -i sbj_"+subj+".mp4 -vf \"scale=trunc(iw/25)*2:trunc(ih/25)*2\" -r 2 -map 0 -map -0:a s"+subj+".mp4"
p = Popen([s], stdout=PIPE, stderr=PIPE, shell=True, executable="/bin/bash")
stdout, stderr = p.communicate()
outstr = stdout.decode('utf-8').strip('\n').strip('\r')
