#!/usr/bin/env python3
"""Create a derivative Supertonic voice style by blending existing styles.

The open-source Supertonic release has no style encoder (that is Supertone's
paid Voice Builder), but styles are just two embedding tensors — style_ttl
(timbre, [1, 50, 256]) and style_dp (prosody, [1, 8, 16]) — and convex
combinations of existing styles are themselves valid styles (the approach the
community Supertonic-Voice-Mixer tool uses). This helper blends N input
styles with given weights into a new style JSON that
repack-supertonic-voices.sh can pack as an extra speaker id.

Usage:
  mix_voice_styles.py out.json in1.json W1 in2.json W2 [in3.json W3 ...]

Example (60/40 blend of two stock voices):
  python3 mix_voice_styles.py custom-voice-styles/mix-f2-f5.json \
      .work/styles/F2.json 0.6 .work/styles/F5.json 0.4
"""
import json
import sys
from pathlib import Path

import numpy as np


def load_style(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    for key in ("style_ttl", "style_dp"):
        if key not in data or "dims" not in data[key] or "data" not in data[key]:
            raise ValueError(f"{path}: not a Supertonic style JSON (missing {key})")
    return data


def tensor(style: dict, key: str) -> np.ndarray:
    dims = tuple(int(x) for x in style[key]["dims"])
    return np.asarray(style[key]["data"], dtype=np.float32).reshape(dims)


def main() -> int:
    if len(sys.argv) < 6 or (len(sys.argv) - 2) % 2 != 0:
        print(__doc__)
        return 2

    out_path = Path(sys.argv[1])
    pairs = [
        (Path(sys.argv[i]), float(sys.argv[i + 1]))
        for i in range(2, len(sys.argv), 2)
    ]

    weights = np.asarray([w for _, w in pairs], dtype=np.float64)
    if weights.sum() <= 0:
        raise ValueError("Weights must sum to a positive value")
    weights = weights / weights.sum()

    styles = [load_style(p) for p, _ in pairs]
    reference = styles[0]

    blended: dict = {}
    for key in ("style_ttl", "style_dp"):
        stack = np.stack([tensor(s, key) for s in styles], axis=0)
        mixed = np.tensordot(weights, stack, axes=(0, 0)).astype(np.float32)
        blended[key] = {
            "dims": list(reference[key]["dims"]),
            "data": mixed.flatten().tolist(),
        }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(blended, f)

    recipe = " + ".join(f"{w:.2f}*{p.stem}" for (p, _), w in zip(pairs, weights))
    print(f"Wrote {out_path} ({recipe})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
