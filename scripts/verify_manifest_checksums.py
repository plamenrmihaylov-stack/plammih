#!/usr/bin/env python3
"""Verify exact SHA-256 digests against manifest_checksums.txt."""

from __future__ import annotations

import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "manifest_checksums.txt"
DIGEST_RE = re.compile(r"^[0-9a-f]{64}$")


def main() -> int:
    try:
        lines = MANIFEST.read_text(encoding="utf-8").splitlines()
    except OSError as exc:
        print(f"FAIL: cannot read manifest: {exc}", file=sys.stderr)
        return 2

    errors: list[str] = []
    seen: set[str] = set()
    checked = 0

    for line_no, raw in enumerate(lines, start=1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        match = re.fullmatch(r"([0-9a-f]{64})  (.+)", line)
        if not match:
            errors.append(f"line {line_no}: expected '<64 lowercase hex>  <path>'")
            continue
        expected, relative = match.groups()
        if relative in seen:
            errors.append(f"line {line_no}: duplicate path {relative!r}")
            continue
        seen.add(relative)

        path = (ROOT / relative).resolve()
        if path != ROOT and ROOT not in path.parents:
            errors.append(f"line {line_no}: path escapes repository root: {relative!r}")
            continue
        if not path.is_file():
            errors.append(f"line {line_no}: file is missing or not regular: {relative!r}")
            continue
        try:
            actual = hashlib.sha256(path.read_bytes()).hexdigest()
        except OSError as exc:
            errors.append(f"line {line_no}: cannot read {relative!r}: {exc}")
            continue
        checked += 1
        if actual != expected:
            errors.append(
                f"{relative}: SHA-256 mismatch; expected {expected}, actual {actual}"
            )
        else:
            print(f"PASS {relative} {actual}")

    if not seen:
        errors.append("manifest contains no file entries")
    if errors:
        for error in errors:
            print(f"FAIL {error}", file=sys.stderr)
        print(f"Checksum verification failed: {len(errors)} issue(s), {checked} file(s) checked.", file=sys.stderr)
        return 1

    print(f"Checksum verification passed: {checked} file(s) matched exact SHA-256.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
