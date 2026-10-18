#!/usr/bin/env python3
"""Validate the support workflow document and checksum-ledger integrity claims."""

from __future__ import annotations

import hashlib
import re
import sys
from pathlib import Path

SHA256_RE = re.compile(r"^[0-9a-fA-F]{64}$")
ABBREVIATED_RE = re.compile(r"^[0-9a-fA-F]{4,63}\.\.\.[0-9a-fA-F]{2,63}$")
REQUIRED_HEADINGS = (
    "# Agile Business Consulting Technical Support Workflow",
    "## 1. Repository checksum correlation ledger",
    "## 2. Agile Business Consulting Technical Support",
    "## 3. Proposed CI/CD reaction sequence",
    "## 4. Operational status",
)
REQUIRED_COMPONENTS = (
    "Core Policy Register",
    "Edge Gateway Proxy",
    "Container Image Source",
    "Device Policy Manifest",
    "Service Guardian Engine",
)
REQUIRED_GUARDRAILS = (
    "Unverified",
    "full 64-character hexadecimal digest",
    "does **not** claim",
    "Fail validation",
)
BT = chr(96)


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)


def main() -> int:
    if len(sys.argv) != 2:
        fail("usage: validate_checksum_ledger.py <markdown-file>")
        return 2

    path = Path(sys.argv[1])
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        fail(f"cannot read {path}: {exc}")
        return 2

    errors: list[str] = []
    for heading in REQUIRED_HEADINGS:
        if heading not in text:
            errors.append(f"missing required heading: {heading}")
    for component in REQUIRED_COMPONENTS:
        if component not in text:
            errors.append(f"missing checksum-ledger component: {component}")
    for guardrail in REQUIRED_GUARDRAILS:
        if guardrail not in text:
            errors.append(f"missing integrity/status guardrail: {guardrail}")

    table_header = "| Component / artifact | Reported repository path | Reported SHA-256 | Reported tag / baseline | Verification status |"
    if table_header not in text:
        errors.append("checksum ledger table header is missing or changed unexpectedly")

    for row in text.splitlines():
        if not row.startswith("|") or "Reported SHA-256" in row:
            continue
        if re.fullmatch(r"\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?", row.strip()):
            continue
        if row.count("|") < 6:
            errors.append(f"malformed checksum-ledger table row: {row}")

    # Abbreviated hashes are accepted only as explicitly abbreviated display values.
    for line_no, line in enumerate(text.splitlines(), start=1):
        if "sha-256" not in line.lower() and "sha256" not in line.lower():
            continue
        for value in re.findall(BT + r"([^" + BT + r"]+)" + BT, line):
            if "..." in value and ABBREVIATED_RE.fullmatch(value):
                continue
            if SHA256_RE.fullmatch(value):
                continue
            if re.search(r"[0-9a-fA-F]{4,}\.\.\.[0-9a-fA-F]{2,}", value):
                errors.append(f"line {line_no}: malformed abbreviated SHA-256 value {value!r}")

    empty_digest = hashlib.sha256(b"").hexdigest()
    if empty_digest in text and not re.search(
        r"empty file|actual file bytes|actual bytes", text, flags=re.IGNORECASE
    ):
        errors.append("empty-file SHA-256 is present without an explanatory warning")

    risky_claims = (
        "webhook triggered",
        "zero downtime achieved",
        "fully synchronized",
        "automation deployed successfully",
    )
    lowered = text.lower()
    for claim in risky_claims:
        if claim in lowered:
            errors.append(f"unsupported operational success claim appears: {claim!r}")

    if errors:
        for error in errors:
            fail(error)
        print(f"Validation failed with {len(errors)} issue(s).", file=sys.stderr)
        return 1

    print(f"PASS: {path} contains the required sections, ledger structure, and integrity caveats.")
    print("NOTE: abbreviated digests are checked for presentation only; they are not cryptographically verified.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
