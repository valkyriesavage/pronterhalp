import getopt, sys
import subprocess
import os

def main(argv):
  try:
    opts, args = getopt.getopt(argv, "hf:x:y:z:", ["help", "filename="])
  except getopt.GetoptError:
    usage()
    sys.exit(2)

  x = 90
  y = 90
  z = 90
  fname = ""

  for opt, arg in opts:
    if opt == "-x":
      x = arg
    if opt == "-y":
      y = arg
    if opt == "-z":
      z = arg
    if opt in ("-f", "--filename="):
      fname = arg
    if opt in ("-h", "--help"):
      usage()
      sys.exit(0)

  if fname == "":
    usage()
    sys.exit(0)

  for xVal in range(0, 360, x):
    for yVal in range(0, 360, y):
      for zVal in range(0, 360, z):
        doRotation(xVal, yVal, zVal, fname)


def doRotation(x, y, z, fname):
  scadFile = createOpenSCADFile(x, y, z, fname)
  success = runOpenSCADFile(x, y, z, fname, scadFile)
  cleanUpScadFile(scadFile)
  return

def createOpenSCADFile(x, y, z, fname):
  print "creating scad file for x {0} y {1} z {2}".format(x, y, z)
  scadFile = "x{0}y{1}z{2}.scad".format(x, y, z)
  fileText = 'rotate([{0},{1},{2}]) import("{3}");'.format(x, y, z, fname)
  f = open(scadFile, 'w+')
  f.write(fileText)
  f.close()
  return scadFile

def runOpenSCADFile(x, y, z, fname, scadFile):
  print "running scad file " + scadFile
  openSCAD = "/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD"
  outFile = "x{0}y{1}z{2}-{3}.stl".format(x,y,z,fname)
  err = subprocess.call([openSCAD, "-o", outFile, scadFile])
  return

def cleanUpScadFile(scadFile):
  os.remove(scadFile)

def usage():
  print """
  Usage:

  doRotations.py -f filename [-x stepSizeX -y stepSizeY -z stepSizeZ]

  where the stepSize variables describe the increase to make
  at each step from 0 to 360.  (i.e. stepSize 90 => 0, 90, 180, 270)

  default for these args is 90

  if stepSize does not divide 360, we get as close as possible without
  going over 360.

  f is the file name you wish to process using this script
"""

if __name__ == "__main__":
  main(sys.argv[1:])
