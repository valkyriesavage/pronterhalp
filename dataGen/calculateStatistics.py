import getopt, sys
import os
import shutil
import subprocess
import json
import re

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
  materialStats = []
  printTimeStats = []
  surfaceAreaStats = []
  anglesStats = []
  trianglesStats = []
  for name in getFilenames(fname):
    material, printTime, surfaceArea, angles = calculateStatistics(name, baseStats)
    x, y, z = getRotation(name, fname)
    triangles = getTriangles(name)
    allStats.append({
      'x': x,
      'y': y,
      'z': z,
      'material': material,
      'printTime': printTime,
      'surfaceArea': surfaceArea,
      'angles': angles,
      'triangles': triangles})
    materialStats.append({
      'x': x,
      'y': y,
      'z': z,
      'material': material})
    printTimeStats.append({
      'x': x,
      'y': y,
      'z': z,
      'printTime': printTime })
    surfaceAreaStats.append({
      'x': x,
      'y': y,
      'z': z,
      'surfaceArea': surfaceArea})
    anglesStats.append({
      'x': x,
      'y': y,
      'z': z,
      'angles': angles})
    trianglesStats.append({
      'x': x,
      'y': y,
      'z': z,
      'triangles': triangles})

  with open('allStats.json', 'w+') as f:
    f.write(json.dumps(allStats))
  with open('materialStats.json', 'w+') as f:
    f.write(json.dumps(materialStats))
  with open('printTimeStats.json', 'w+') as f:
    f.write(json.dumps(printTimeStats))
  with open('surfaceAreaStats.json', 'w+') as f:
    f.write(json.dumps(surfaceAreaStats))
  with open('anglesStats.json', 'w+') as f:
    f.write(json.dumps(anglesStats))
  with open('trianglesStats.json', 'w+') as f:
    f.write(json.dumps(trianglesStats))

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
  surfaceArea = 0
  angles = []

  angleLine = re.compile(r"\t(?P<degrees>[0-9\.]*) deg -- \t(?P<count>\d+)")

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
          surfaceArea = float(line.split("units^2")[0])
        m = angleLine.match(line)
        if m:
          angles.append((m.group('degrees'), m.group('count')))

  return (material, printTime, surfaceArea, angles)

def getTriangles(fname):
  triangles = []
  triangleList = re.compile(r'\((?P<v1x>[-\d]*),(?P<v1y>[-\d]*),(?P<v1z>[-\d]*)\)\((?P<v2x>[-\d]*),(?P<v2y>[-\d]*),(?P<v2z>[-\d]*)\)\((?P<v3x>[-\d]*),(?P<v3y>[-\d]*),(?P<v3z>[-\d]*)\)')
  with open(fname) as f:
    for line in f:
      if line.startswith("*&*\t("):
        # here we go!
        m = triangleList.search(line)
        if not m:
          print line
        v1 = {'x': m.group('v1x'),
              'y': m.group('v1y'),
              'z': m.group('v1z')};
        v2 = {'x': m.group('v2x'),
              'y': m.group('v2y'),
              'z': m.group('v2z')};
        v3 = {'x': m.group('v3x'),
              'y': m.group('v3y'),
              'z': m.group('v3z')};
        if '-' in line:
          print line
          print v1, v2, v3
        triangles.append([v1, v2, v3]);
  return triangles

def usage():
  print """
  Usage:

  determineStatistics.py -f filename

  f is the base file name you wish to process using this script
"""

if __name__ == "__main__":
  main(sys.argv[1:])
