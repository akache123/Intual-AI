import sys
import subprocess
import pathlib

# https://stackoverflow.com/a/62724213
def get_active_branch_name():
  head_dir = pathlib.Path(".") / ".git" / "HEAD"
  with head_dir.open("r") as f:
    content = f.read().splitlines()

  for line in content:
    if line[0:4] == "ref:":
      return line.partition("refs/heads/")[2]

def execute(command: list, error_msg: str) -> list:
  print("[*] executing: ", " ".join(command))

  captured_output = []

  try:
    process = subprocess.Popen(" ".join(command), shell=True,
                                   stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    
    # Loop through the output line by line
    for line in iter(process.stdout.readline, b''):
      sys.stdout.write(line.decode('utf-8'))  # Write to stdout
      sys.stdout.flush()  # Ensure it is immediately printed
      captured_output.append(line.decode('utf-8'))  # Capture output

    process.stdout.close()
    process.wait()

    if process.returncode != 0:
      raise subprocess.CalledProcessError(process.returncode, command)
    
  except subprocess.CalledProcessError:
    print(f"[!] {error_msg}")
    exit(1)

  return captured_output