import getopt, sys
import os
import shutil
import subprocess

SKEINFORGE_FOLDER = "/Users/valkyrie/projects/libraries/Printrun/skeinforge/"

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

  generateBaseGCode(fname)
  for name in getFilenames(fname):
    if not os.path.exists(name.replace('.stl', '_raft.gcode')):
      callSkeinforge(name)

  cleanDirectory(fname)

def filesDir(fname):
  return fname.split('.')[0] + "-files"

def generateBaseGCode(fname):
  support = "/Users/valkyrie/.skeinforge/profiles/extrusion/ABS/raft-usesupport.csv"
  no_support = "/Users/valkyrie/.skeinforge/profiles/extrusion/ABS/raft-nosupport.csv"
  in_use = "/Users/valkyrie/.skeinforge/profiles/extrusion/ABS/raft.csv"
  shutil.copy(no_support, in_use)
  callSkeinforge(os.path.join(filesDir(fname), fname))
  shutil.copy(support, in_use)

def getFilenames(base):
  ret = []
  for fname in os.listdir(filesDir(base)):
    if fname.endswith('.stl'):
      ret.append(os.path.join(filesDir(base), fname))
  return ret

def callSkeinforge(fname):
  skeinforge_slice = os.path.join(SKEINFORGE_FOLDER, "skeinforge_application/skeinforge_plugins/craft_plugins/raft.py")
  subprocess.call(["python", skeinforge_slice, fname])

def cleanDirectory(fname):
  # the unfortunate thing is that we can't tell skeinforge
  # where we want our outfiles to go
  basename = fname.split('.')[0]
  for anyfile in os.listdir(os.curdir):
    if basename in anyfile and not os.path.isdir(anyfile):
      os.rename(anyfile, os.path.join(filesDir(fname), anyfile))
  shutil.copy(os.path.join(filesDir(fname), fname), fname)

def usage():
  print """
  Usage:

  generateGCode.py -f filename

  f is the base file name you wish to process using this script
"""

if __name__ == "__main__":
  main(sys.argv[1:])
