"""Record the actual isolated CI runtime and retain wheel license notices.

Installation uses the adjacent hash-locked Linux wheel profile. This evidence
does not change production r-pending labels or release a Windows host adapter.
"""
import hashlib
import importlib.metadata
import json
from pathlib import Path
import platform
import sys
import zipfile

root = Path(__file__).resolve().parents[2]
output = root / "test-results/aimfit"
output.mkdir(parents=True, exist_ok=True)
versions = {name: importlib.metadata.version(name) for name in ("numpy", "scipy")}
if platform.python_version() != "3.12.10" or versions != {"numpy": "2.1.3", "scipy": "1.15.3"}:
    raise SystemExit("Numerical runtime version mismatch")
if sys.platform != "linux" or platform.machine() != "x86_64":
    raise SystemExit("This locked profile is Linux x86_64 only")
expected_wheels = {
    "numpy": "2312b2aa89e1f43ecea6da6ea9a810d06aae08321609d8dc0d0eda6d946a541b",
    "scipy": "271e3713e645149ea5ea3e97b57fdab61ce61333f97cfae392c28ba786f9bb49",
}
installed = json.loads((output / "pip-install.json").read_text(encoding="utf-8"))["install"]
if len(installed) != 2 or {item["metadata"]["name"].lower() for item in installed} != set(expected_wheels):
    raise SystemExit("Installation report must identify both locked numerical wheels")
for item in installed:
    name = item["metadata"]["name"].lower()
    if item["metadata"]["version"] != versions[name] or item["download_info"]["archive_info"]["hashes"]["sha256"] != expected_wheels[name]:
        raise SystemExit("Installed wheel identity mismatch: " + name)

def digest(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()

identities = {str(file.relative_to(root)): digest(file) for file in (
    root / "modules/aimfit/runtime/worker.py",
    root / "modules/aimfit/reference/oracle.R",
    root / "scripts/aimfit-compare-oracle.py",
    root / ".github/aimfit-linux-requirements.txt",
)}
reference = json.loads((root / ".github/fixtures/aimfit-r-4.6.1-manifest.json").read_text(encoding="utf-8"))
if digest(root / ".github/fixtures/aimfit-r-4.6.1.csv") != reference["csvSha256"] or identities["modules/aimfit/reference/oracle.R"] != reference["oracleScriptSha256"]:
    raise SystemExit("Captured official R reference identity mismatch")
wheels = sorted((root / ".test-data/aimfit-wheels").glob("*.whl"))
if len(wheels) != 2:
    raise SystemExit("Expected precisely the two locked numerical wheels")
for wheel in wheels:
    identities[wheel.name] = digest(wheel)
    with zipfile.ZipFile(wheel) as archive:
        notices = [name for name in archive.namelist() if ".dist-info/" in name and any(
            token in Path(name).name.upper() for token in ("LICENSE", "COPYING", "NOTICE"))]
        if not notices:
            raise SystemExit("Missing wheel license notices: " + wheel.name)
        for index, name in enumerate(notices):
            # Write under an owned fixed directory, never use an archive path as a target.
            (output / (wheel.name + ".license-" + str(index) + ".txt")).write_bytes(archive.read(name))

manifest = {"version": "aimfit-ci-runtime-v1", "python": platform.python_version(),
    "pythonSha256": digest(Path(sys.executable).resolve()), "packages": versions,
    "platform": platform.platform(), "machine": platform.machine(), "artifacts": identities,
    "productionReferenceStatus": "r-pending", "hostRuntimeReleased": False}
(output / "runtime-manifest.json").write_text(json.dumps(manifest, sort_keys=True, indent=2) + "\n", encoding="utf-8")
