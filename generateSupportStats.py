import getopt, sys
import os
import shutil
import subprocess

CURA_FOLDER = "/Users/valkyrie/projects/libraries/CuraEngine"

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

  for name in getFilenames(fname):
    callCura(name)

def filesDir(fname):
  return fname.split('.')[0] + "-files"

def getFilenames(base):
  ret = []
  for fname in os.listdir(filesDir(base)):
    if fname.endswith('.stl'):
      ret.append(os.path.join(filesDir(base), fname))
  return ret

def callCura(fname):
  logfile = open(fname.replace(".stl", "_support.txt"), 'w+')
  cura_support = os.path.join(CURA_FOLDER, "CuraEngine")
  subprocess.call([cura_support, '-v', fname, '-o', '/dev/null'], stdout=logfile)

def usage():
  print """
  Usage:

  generateSupportStats.py -f filename

  f is the base file name you wish to process using this script
"""

if __name__ == "__main__":
  main(sys.argv[1:])
