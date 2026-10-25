#!/usr/bin/env bash
set -euo pipefail

# Download only the pinned release and verify its official SHA-256 before running.
tool_dir="$(mktemp -d)"
archive="$tool_dir/actionlint.tar.gz"
curl --fail --silent --show-error --location \
  https://github.com/rhysd/actionlint/releases/download/v1.7.12/actionlint_1.7.12_linux_amd64.tar.gz \
  --output "$archive"
printf '%s  %s\n' '8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8' "$archive" | sha256sum --check --status
tar -xzf "$archive" -C "$tool_dir" actionlint
"$tool_dir/actionlint" -color
