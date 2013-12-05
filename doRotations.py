import getopt, sys, shutil
import math, random
import subprocess
import os

def main(argv):
  try:
    opts, args = getopt.getopt(argv, "hf:n:", ["help", "filename="])
  except getopt.GetoptError:
    usage()
    sys.exit(2)

  fname = ""
  n = 400

  for opt, arg in opts:
    if opt in ("-f", "--filename="):
      fname = arg
    if opt in ("-n"):
      n = int(arg)
    if opt in ("-h", "--help"):
      usage()
      sys.exit(0)

  if fname == "":
    usage()
    sys.exit(0)

  ranges = getRanges(n)

  for idx in range(len(ranges['x'])):
    xVal = ranges['x'][idx]
    yVal = ranges['y'][idx]
    zVal = ranges['z'][idx]
    doRotation(xVal, yVal, zVal, fname)

def getRanges(n):
  ret = {
      'x': [],
      'y': [],
      'z': []}
  zee = 0;
  for ex in range(-180, 180, int(math.sqrt(n))):
    for why in range(-180, 180, int(math.sqrt(n))):
      ret['x'].append(ex)
      ret['y'].append(why)
      ret['z'].append(zee)

  return ret

def doRotation(x, y, z, fname):
  scadFile = createOpenSCADFile(x, y, z, fname)
  success = runOpenSCADFile(x, y, z, fname, scadFile)
  cleanUpScadFile(scadFile)
  return

def createOpenSCADFile(x, y, z, fname):
  filesDir = fname.split('.')[0] + "-files"
  if not os.path.exists(filesDir):
    os.mkdir(filesDir)
  shutil.copy(fname, os.path.join(filesDir, fname))
  scadFile = "x{0}y{1}z{2}.scad".format(x, y, z)
  scadFile = os.path.join(filesDir, scadFile)
  if os.path.exists(scadFile):
    return scadFile
  fileText = 'rotate([{0},{1},{2}]) import("{3}");'.format(x, y, z, fname)
  f = open(scadFile, 'w+')
  f.write(fileText)
  f.close()
  return scadFile

def runOpenSCADFile(x, y, z, fname, scadFile):
  openSCAD = "/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD"
  outFile = "x{0}y{1}z{2}-{3}".format(x,y,z,fname)
  outFile = os.path.join(os.path.dirname(scadFile), outFile)
  if os.path.exists(outFile):
    return
  err = subprocess.call([openSCAD, "-o", outFile, scadFile])
  return

def cleanUpScadFile(scadFile):
  os.remove(scadFile)

def usage():
  print """
  Usage:

  doRotations.py -f filename [-n numpoints]

  f is the file name you wish to process using this script

  n is the number of points on the sphere you wish to sample, default 100
"""

if __name__ == "__main__":
  main(sys.argv[1:])
