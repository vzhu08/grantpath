"""Operator-only offline comparison of production primitive to captured official R CSV.

python -I -B scripts/aimfit-compare-oracle.py oracle.csv <pinned-R-version>
No network/install/write. Input <=2MiB; exact columns/identities/case counts.
Passing this tool does NOT automatically promote core result labels to R-checked.
"""
import csv
import hashlib
import importlib.util
import io
import json
import math
from pathlib import Path
import platform
import sys
from fractions import Fraction
import numpy as np
import scipy

if len(sys.argv) != 3 or platform.python_version() != "3.12.10" or np.__version__ != "2.1.3" or scipy.__version__ != "1.15.3":
    raise SystemExit("Pinned Python/numpy/scipy and explicit R version required")
with Path(sys.argv[1]).open("rb") as source:
    raw = source.read(2097153)
if len(raw) > 2097152:
    raise SystemExit("Oracle capacity exceeded")
columns = ["case_id","r_version","stats_version","n_per_arm","delta","sigma","power","nominal_half_width"]
reader = csv.DictReader(io.StringIO(raw.decode("utf-8-sig")))
if reader.fieldnames != columns:
    raise SystemExit("Unexpected oracle schema")
rows = list(reader)
specs = {"r005": (1,20,1000),"r010": (1,10,1000),"r025": (1,4,1000),"r050": (5,10,1000),
         "r100": (1,1,1000),"r175": (7,4,800),"r200": (2,1,612),
         "sensitivity_delta4": (4,10,64),"sensitivity_sd12": (5,12,64),"scaled": (50,100,64),"null_oracle_only": (0,10,64)}
expected = {(key,n) for key,(_,_,end) in specs.items() for n in (range(2,end+1) if key.startswith("r") else [64])}
seen = set()
root = Path(__file__).resolve().parents[1]
worker_path = root / "modules/aimfit/runtime/worker.py"
module_spec = importlib.util.spec_from_file_location("aimfit_trusted_worker",worker_path)
worker = importlib.util.module_from_spec(module_spec)
module_spec.loader.exec_module(worker)
production = {key: worker.numeric_grid(Fraction(delta),Fraction(sigma),end) for key,(delta,sigma,end) in specs.items()}
max_power_error, max_width_error = 0.0, 0.0
baseline = {}
for row in rows:
    if set(row) != set(columns) or None in row or row["r_version"] != sys.argv[2] or row["stats_version"] != sys.argv[2]:
        raise SystemExit("Oracle version/row mismatch")
    key, n = row["case_id"], int(row["n_per_arm"])
    identity = (key,n)
    if identity not in expected or identity in seen:
        raise SystemExit("Unexpected/duplicate oracle case")
    seen.add(identity)
    delta,sigma,_ = specs[key]
    if Fraction(row["delta"]) != delta or Fraction(row["sigma"]) != sigma:
        raise SystemExit("Oracle assumptions mismatch")
    ref_power, ref_width = float(row["power"]),float(row["nominal_half_width"])
    _,power,width = production[key]
    p,w = float(power[n-2]),float(width[n-2])
    if not all(math.isfinite(x) for x in [ref_power,ref_width,p,w]) or not 0 <= ref_power <= 1 or ref_width <= 0:
        raise SystemExit("Nonfinite/invalid oracle value")
    pe,we = abs(p-ref_power),abs(w-ref_width)
    max_power_error,max_width_error = max(max_power_error,pe),max(max_width_error,we)
    if pe > 1e-7 or we > max(1e-8,1e-7*abs(ref_width)):
        raise SystemExit("Reference tolerance exceeded: " + key + "/" + str(n))
    if key == "r050": baseline[n] = (ref_power,ref_width,p,w)
if seen != expected:
    raise SystemExit("Missing oracle cases")
for target,width_target,minimum in [(.8,None,64),(.9,None,86),(.9,3,87)]:
    for pi,wi in [(0,1),(2,3)]:
        found = min(n for n,values in baseline.items() if values[pi] >= target and (width_target is None or values[wi] <= width_target))
        if found != minimum: raise SystemExit("Integer minimum mismatch")
print(json.dumps({"version": "aimfit-oracle-comparison-v1","status": "compared","rVersion": sys.argv[2],"python": platform.python_version(),
    "numpy": np.__version__,"scipy": scipy.__version__,"caseCount": len(rows),"maxPowerAbsoluteError": max_power_error,"maxWidthAbsoluteError": max_width_error,
    "oracleSha256": hashlib.sha256(raw).hexdigest(),"workerSha256": hashlib.sha256(worker_path.read_bytes()).hexdigest(),
    "oracleScriptSha256": hashlib.sha256((root/"modules/aimfit/reference/oracle.R").read_bytes()).hexdigest(),
    "comparisonScriptSha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
    "pythonSha256": hashlib.sha256(Path(sys.executable).read_bytes()).hexdigest(),"platform": platform.platform()},sort_keys=True))
