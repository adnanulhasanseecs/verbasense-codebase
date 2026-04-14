"""Golden-set evaluation for document-processing regression checks."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GOLDEN = ROOT / "docs" / "evals" / "golden_document_eval.jsonl"


def main() -> int:
    lines = GOLDEN.read_text(encoding="utf-8").splitlines()
    rows = [json.loads(line) for line in lines if line.strip()]
    for idx, row in enumerate(rows):
        expected = row.get("expected", {})
        if "min_key_points" not in expected:
            raise ValueError(f"Row {idx} missing min_key_points")
    print(f"Golden eval dataset loaded: {len(rows)} cases")
    print("Status: PASS (dataset/schema gate)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
