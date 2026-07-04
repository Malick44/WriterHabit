#!/usr/bin/env python3
"""Inspect (and optionally compare) sherpa-onnx Supertonic voice.bin files.

Layout (see vendor/generate_voices_bin.py): two int64[3] headers
([n_voices, d1, d2] for style_ttl, then for style_dp) followed by the
flattened float32 ttl and dp stacks.

Usage:
  verify_voices_bin.py <voice.bin>              # print header + voice count
  verify_voices_bin.py <voice.bin> <other.bin>  # also byte-compare both files
"""
import sys
from pathlib import Path

import numpy as np


def read_header(path: Path):
    with open(path, "rb") as f:
        ttl_dims = np.frombuffer(f.read(3 * 8), dtype=np.int64)
        dp_dims = np.frombuffer(f.read(3 * 8), dtype=np.int64)
    expected = (
        6 * 8
        + int(np.prod(ttl_dims)) * 4
        + int(np.prod(dp_dims)) * 4
    )
    actual = path.stat().st_size
    return ttl_dims, dp_dims, expected, actual


def describe(path: Path) -> int:
    ttl_dims, dp_dims, expected, actual = read_header(path)
    print(f"{path.name}: ttl_dims={ttl_dims.tolist()} dp_dims={dp_dims.tolist()}")
    print(f"  voices={int(ttl_dims[0])} size={actual} bytes (expected {expected})")
    if ttl_dims[0] != dp_dims[0]:
        print("  ERROR: ttl/dp voice counts disagree")
        return 1
    if expected != actual:
        print("  ERROR: file size does not match header dims")
        return 1
    return 0


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2

    status = describe(Path(sys.argv[1]))
    if len(sys.argv) > 2:
        status |= describe(Path(sys.argv[2]))
        a = Path(sys.argv[1]).read_bytes()
        b = Path(sys.argv[2]).read_bytes()
        if a == b:
            print("COMPARE: byte-identical ✓")
        else:
            print(f"COMPARE: files differ (sizes {len(a)} vs {len(b)})")
            status |= 1
    return status


if __name__ == "__main__":
    raise SystemExit(main())
