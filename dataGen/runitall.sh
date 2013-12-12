#!/bin/sh

python doRotations.py -f $1
python generateGCode.py -f $1
python generateSupportStats.py -f $1
python calculateStatistics.py -f $1
