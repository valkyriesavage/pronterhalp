import getopt, sys
import os
import shutil
import subprocess

MATERIAL = 0
PRINTTIME = 1
CLEANTIME = 2

def main(argv):
  try:
    opts, args = getopt.getopt(argv, "hf:", ["help", "filename="])
  except getopt.GetoptError:
    usage()
    sys.exit(2)

  fname = ""

  for opt, arg in opts:
    if opt in ("-f", "--filename="):
      fname = arg
    if opt in ("-h", "--help"):
      usage()
      sys.exit(0)

  if fname == "":
    usage()
    sys.exit(0)

  baseStats = calculateBaseStatistics(fname)
  print baseStats
  allStats = []
  for name in getFilenames(fname):
    material, printTime, cleanTime = calculateStatistics(name, baseStats)
    x, y, z = getRotation(name, fname)
    allStats.append({
      'x': x,
      'y': y,
      'z': z,
      'material': material,
      'printTime': printTime,
      'cleanTime': cleanTime})
  print allStats

def filesDir(fname):
  return fname.split('.')[0] + "-files"

def calculateBaseStatistics(fname):
  fullName = os.path.join(filesDir(fname), fname.split('.')[0] + '_raft.txt')
  return calculateStatistics(fullName, [0,0,0])

def getFilenames(base):
  ret = []
  baseFileName = base.split('.')[0] + "_raft.txt"
  for fname in os.listdir(filesDir(base)):
    if fname.endswith('_support.txt') and not fname.startswith(baseFileName):
      ret.append(os.path.join(filesDir(base), fname))
  return ret

def getRotation(fname, basefname):
  fname = fname.split('/')[1]
  if fname.split('_')[0] == basefname.split('.')[0]:
    return (0,0,0)
  x = fname.split('x')[1].split('y')[0]
  y = fname.split('y')[1].split('z')[0]
  z = fname.split('z')[1]
  if len(z.split('-')[0]) > 0:
    z = z.split('-')[0]
  else:
    z = '-' + z.split('-')[1]
  return (x, y, z)

def calculateStatistics(fname, baseStats):
  material = 0
  printTime = 0
  cleanTime = 0

  supportArea = 0
  avgAngle = 0

  with open(fname.replace("_support", "_raft")) as f:
    for line in f:
      if line.startswith("Build time is "):
        hms = line.split("Build time is ")[1]
        h = float(hms.split("hour")[0].strip("s"))
        m = float(hms.split("hour")[1].split("minute")[0].strip("s"))
        s = float(hms.split("minute")[1].split("second")[0].strip("s"))
        printTime = h*60 + m + s/60.0
      if line.startswith("Mass extruded is "):
        material = float(line.split("Mass extruded is ")[1].split(" ")[0])
        material = material - baseStats[MATERIAL]
  with open(fname) as f:
    for line in f:
      if line.startswith("*&* "):
        line = line.split("*&* ")[1]
        if "units^2" in line:
          supportArea = float(line.split("units^2")[0])
        if "max angle" in line:
          maxAngle = float(line.split("max angle")[0])
        if "min angle" in line:
          minAngle = float(line.split("min angle")[0])
        if "average angle" in line:
          avgAngle = float(line.split("average angle")[0])

  cleanTime = supportArea*avgAngle

  return (material, printTime, cleanTime)

def usage():
  print """
  Usage:

  determineStatistics.py -f filename

  f is the base file name you wish to process using this script
"""

if __name__ == "__main__":
  main(sys.argv[1:])
