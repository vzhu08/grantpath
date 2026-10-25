"""AIMFIT numeric protocol v1. Trusted local script; no request paths/code/imports.

Python 3.12.10 / numpy 2.1.3 / scipy 1.15.3. R reference gate PENDING.
This script does not install packages, write files, read credentials, or use network.
Process/network confinement must additionally be enforced by its deployment host.
"""
import hashlib
import json
import math
import platform
import re
import sys
import sysconfig
import warnings
from fractions import Fraction
from decimal import Decimal

MAX_BYTES = 65536


def closed(obj, keys):
    if type(obj) is not dict or set(obj) != set(keys):
        raise ValueError("invalid_protocol")


def decimal(value, positive=True):
    if type(value) is not str or not re.fullmatch(r"(0|[1-9]\d*)(\.\d*[1-9])?", value):
        raise ValueError("invalid_decimal")
    parts = value.split(".")
    if sum(map(len, parts)) > 12 or (len(parts) == 2 and len(parts[1]) > 6):
        raise ValueError("invalid_decimal")
    result = Fraction(value)
    if positive and result <= 0:
        raise ValueError("invalid_decimal")
    return result


def formatted(value):
    if not math.isfinite(value):
        raise ValueError("nonfinite_result")
    plain = format(Decimal(format(float(value), ".17g")), "f")
    return plain.rstrip("0").rstrip(".") if "." in plain else plain


def numeric_grid(delta, sigma, nmax):
    """Single production primitive, also exercised by the offline R comparator."""
    import numpy as np
    from scipy.stats import nct, t
    grid = np.arange(2, nmax + 1)
    df = 2 * grid - 2
    with warnings.catch_warnings():
        warnings.simplefilter("error")
        critical = t.ppf(.975, df)
        noncentrality = float(delta / sigma) * np.sqrt(grid / 2)
        # Symmetry evaluates BOTH rejection tails; no conditional NaN fallback.
        power = nct.sf(critical, df, noncentrality) + nct.sf(critical, df, -noncentrality)
        half_width = critical * float(sigma) * np.sqrt(2 / grid)
    if not (np.all(np.isfinite(critical)) and np.all(np.isfinite(power)) and np.all(np.isfinite(half_width)) and np.all((power >= 0) & (power <= 1)) and np.all(half_width > 0)):
        raise ValueError("invalid_numeric_result")
    if np.any(np.diff(power) < -1e-10) or np.any(np.diff(half_width) > 1e-8):
        raise ValueError("monotonicity_failure")
    return grid, power, half_width


def classify_search(power, half_width, target, width, point):
    import numpy as np
    power_boundary = np.abs(power - float(target)) <= 1e-7
    width_tolerance = np.maximum(1e-8, 1e-7*np.abs(half_width))
    width_boundary = np.zeros(len(power), dtype=bool) if width is None else np.abs(half_width - float(width)) <= width_tolerance
    raw_pass = (power >= float(target)) & (True if width is None else half_width <= float(width))
    near = (power_boundary | width_boundary) & ((power >= float(target)-1e-7) & (True if width is None else half_width <= float(width)+width_tolerance))
    passing = np.flatnonzero(raw_pass)
    if len(passing):
        index = int(passing[0])
        if np.any(near[:index+1]):
            return {"status": "boundary_review"}
        n = index + 2
        return {"status": "found", "point": point(n), "predecessor": None if n == 2 else point(n-1)}
    return {"status": "boundary_review" if near[-1] else "beyond_supported_range"}


def main():
    if platform.python_version() != "3.12.10":
        raise ValueError("runtime_version_mismatch")
    import numpy as np
    import scipy
    if np.__version__ != "2.1.3" or scipy.__version__ != "1.15.3":
        raise ValueError("dependency_version_mismatch")
    raw = sys.stdin.buffer.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise ValueError("input_capacity")
    request = json.loads(raw)
    closed(request, ["version", "queries"])
    if request["version"] != "aimfit-numeric-v1" or type(request["queries"]) is not list or not 1 <= len(request["queries"]) <= 7:
        raise ValueError("invalid_protocol")
    ids, results = set(), []
    for q in request["queries"]:
        closed(q, ["id", "delta", "sigma", "targetPower", "halfWidth", "ns"])
        if type(q["id"]) is not str or not re.fullmatch(r"[A-Za-z0-9_-]{1,100}", q["id"]) or q["id"] in ids:
            raise ValueError("invalid_identity")
        ids.add(q["id"])
        delta, sigma, target = decimal(q["delta"]), decimal(q["sigma"]), decimal(q["targetPower"])
        width = None if q["halfWidth"] is None else decimal(q["halfWidth"])
        ratio = delta / sigma
        if not Fraction(1,20) <= ratio <= 2 or not Fraction(3,5) <= target <= Fraction(19,20):
            raise ValueError("unsupported_range")
        nmax = min(1000, (2450 * ratio.denominator**2) // ratio.numerator**2)
        ns = q["ns"]
        if type(ns) is not list or len(ns) > 3 or any(type(n) is not int or not 2 <= n <= nmax for n in ns) or len(set(ns)) != len(ns):
            raise ValueError("invalid_candidates")
        grid, power, half_width = numeric_grid(delta, sigma, nmax)

        def point(n):
            return {"nPerArm": n, "power": formatted(power[n-2]), "nominalHalfWidth": formatted(half_width[n-2])}

        # Full bounded grid avoids a hidden convergence/root-rounding assumption.
        search = classify_search(power, half_width, target, width, point)
        results.append({"id": q["id"], "points": [point(n) for n in ns], "search": search})
    with open(__file__, "rb") as source:
        worker_hash = hashlib.sha256(source.read()).hexdigest()
    with open(sys.executable, "rb") as source:
        python_hash = hashlib.sha256(source.read()).hexdigest()
    # Build architecture does not depend on inherited Windows environment variables.
    runtime_platform = {"win-amd64": "win32-x64", "linux-x86_64": "linux-x64"}.get(sysconfig.get_platform(), "unsupported")
    response = {"version": "aimfit-numeric-v1", "engine": {"method": "pooled-t-both-tails-v1", "protocol": "aimfit-numeric-v1",
        "python": platform.python_version(), "scipy": scipy.__version__, "numpy": np.__version__, "workerSha256": worker_hash,
        "referenceStatus": "r-pending", "pythonSha256": python_hash, "platform": runtime_platform}, "scenarios": results}
    encoded = json.dumps(response, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("utf-8")
    if len(encoded) > MAX_BYTES:
        raise ValueError("output_capacity")
    sys.stdout.buffer.write(encoded)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        # Bounded diagnostic only; paths, payloads, environment and tracebacks stay private.
        codes = {"invalid_protocol", "invalid_decimal", "nonfinite_result", "runtime_version_mismatch", "dependency_version_mismatch", "input_capacity", "invalid_identity", "unsupported_range", "invalid_candidates", "invalid_numeric_result", "monotonicity_failure", "output_capacity"}
        code = str(error) if type(error) is ValueError and str(error) in codes else "aimfit_numeric_failure"
        sys.stderr.write(code + "\n")
        sys.exit(2)
