#!/usr/bin/env python3
import sys,csv
import numpy as np
from subprocess import Popen, PIPE
import mediapipe as mp
import cv2

subj = str(0)  # here we set the subject to compress

# start up mediapipe:
mp_drawing = mp.solutions.drawing_utils # Drawing helpers
mp_holistic = mp.solutions.holistic # Mediapipe Solutions
holistic = mp_holistic.Holistic(min_detection_confidence=0.3, min_tracking_confidence=0.5, static_image_mode=False, model_complexity=2)

# compres CSV file into a js-friendly low-res js file
with open('sbj_'+subj+'.csv') as f:
	reader = csv.reader(f, delimiter = ',')
	adata = list(reader)
print(adata[0])
# arbitrarily skipped datapoints and quantization, just to test
skipSize = 5; quant = 10
# create data structure:
acc = np.zeros([12,int(len(adata)/skipSize)+1])  # add one extra (might be left 0)
i=0
prvLabel=-1;  # start with unknown previous class
indx = []
clss = []
for row in adata[1:-1:skipSize]:
	for sensor in range(0,12):
		acc[sensor][i] = (float(row[sensor+1])*quant)
		offset = (quant*16)-(quant*4)
		if sensor in [0,1,2]: acc[sensor][i] += offset  # right arm
		elif sensor in [6,7,8]: acc[sensor][i] -= 2*offset  # left leg
		elif sensor in [3,4,5]: acc[sensor][i] -= offset  # right leg
	if row[13] != prvLabel:
		indx.append(i);
		clss.append(row[13]);
		prvLabel = row[13]
	i+=1
# write to file:
with open('dta'+subj+'.js',"w") as f:
	i=0
	for sensor in ["raX","raY","raZ","laX","laY","laZ","rlX","rlY","rlZ","llX","llY","llZ"]:
		f.write("var "+sensor+"=[")
		f.write(",".join( list( map (str, [int(x) for x in acc[i][:-2] ]) ) ) )  # -2: remove last potential 0*
		f.write("];\n")
		i+=1
print(indx)
print(clss)

exit(0)  # remove this for the video:

# Example to get 3rd person view video and obtain skeleton:
tpvmovfile = '/Users/kvl/sciebo/Projects/trimmed_WEAR_clip/sbj_18_tpv_25f.mp4'  #
vidcap_movtpv = cv2.VideoCapture(tpvmovfile)
duration = (60*37)+21
for i in range(0,int((10)*duration)):
    success,image_movtpv = vidcap_movtpv.read()
    # To improve performance, optionally mark the image as not writeable to pass by reference:
    #image_movtpv.flags.writeable = True
    # detect pose in third person view video frame:
    #image_movtpv = cv2.cvtColor(image_movtpv, cv2.COLOR_BGR2RGB)
    results = holistic.process(image_movtpv)
    print(results.pose_landmarks)
    print("\n\n")


# compress the original raw video into a 2Hz low-res video for quick access:
# e.g.: subj_0.mp4  is changed into s0.mp4
s = "ffmpeg -i sbj_"+subj+".mp4 -vf \"scale=trunc(iw/25)*2:trunc(ih/25)*2\" -r "+str(int(50/skipSize))+" -map 0 -map -0:a s"+subj+".mp4"
print("executing:\n "+s)
p = Popen([s], stdout=PIPE, stderr=PIPE, shell=True, executable="/bin/bash")
stdout, stderr = p.communicate()
outstr = stdout.decode('utf-8').strip('\n').strip('\r')
