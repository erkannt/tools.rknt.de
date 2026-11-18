# /// script
# requires-python = ">=3.12,<3.14"
# dependencies = ["tmm==0.2.0", "numpy==2.5.5"]
# ///
"""Generate reference reflectance curves with tmm (https://github.com/sbyrnes321/tmm).

p-polarised light only. Complex indices use the n + ik convention (k > 0 absorbs),
which is both tmm's convention and the one used in src/lib/layers.ts.

Usage: uv run scripts/fixtures.py <output.json>
"""

import json
import math
import sys
from pathlib import Path

import tmm

WAVELENGTH = 632.8  # nm, He-Ne laser (Hassani & Kreysing 2019)
# 30° up to the NA 1.7 objective limit in the 1.788 coverslip: asin(1.7 / 1.788) ≈ 72°
ANGLES = [round(30 + i * 0.1, 1) for i in range(0, 421)]

COVERSLIP = complex(1.788, 0)
CHROMIUM = complex(3.3, 4.2731)
GOLD = complex(0.1943, 3.5921)
MEDIA = complex(1.335, 0)
MEMBRANE = complex(1.5, 0)
MEMBRANE_THICKNESS = 8

# Mirrors defaultParams and the slider ranges in src/lib/layers.ts / App.svelte.
DEFAULT_PARAMS = {
    "cytosolIndex": 1.37,
    "mediaThickness": 50,
    "goldThickness": 47,
    "chromiumThickness": 3,
}
PARAM_RANGES = {
    "cytosolIndex": (1.34, 1.40),
    "mediaThickness": (0, 150),
    "goldThickness": (38, 55),
    "chromiumThickness": (2, 5),
}


def stack(p):
    """Layers in the order light passes through them, as (index, thickness in nm)."""
    return [
        (COVERSLIP, math.inf),
        (CHROMIUM, p["chromiumThickness"]),
        (GOLD, p["goldThickness"]),
        (MEDIA, p["mediaThickness"]),
        (MEMBRANE, MEMBRANE_THICKNESS),
        (complex(p["cytosolIndex"], 0), math.inf),
    ]


def reflectance(layers):
    n_list = [n for n, _ in layers]
    d_list = [d for _, d in layers]
    return [
        tmm.coh_tmm("p", n_list, d_list, math.radians(a), WAVELENGTH)["R"]
        for a in ANGLES
    ]


def case(name, layers, params=None):
    c = {
        "name": name,
        "wavelength": WAVELENGTH,
        "layers": [
            # JSON has no Infinity: null marks a semi-infinite layer
            {"re": n.real, "im": n.imag, "thickness": None if math.isinf(d) else d}
            for n, d in layers
        ],
        "angles": ANGLES,
        # rounded so regenerating on another platform doesn't churn the diff
        "reflectance": [round(r, 12) for r in reflectance(layers)],
    }
    if params is not None:
        c["params"] = params
    return c


def cases():
    yield case("single interface", [(COVERSLIP, math.inf), (MEDIA, math.inf)])
    yield case(
        "gold film", [(COVERSLIP, math.inf), (GOLD, 47), (MEDIA, math.inf)]
    )
    yield case("stack, defaults", stack(DEFAULT_PARAMS), DEFAULT_PARAMS)
    for param, (lo, hi) in PARAM_RANGES.items():
        for label, value in (("min", lo), ("max", hi)):
            p = {**DEFAULT_PARAMS, param: value}
            yield case(f"stack, {param} {label}", stack(p), p)


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    out = Path(sys.argv[1])
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(
        json.dumps({"generator": "tmm 0.2.0", "polarization": "p", "cases": list(cases())})
        + "\n"
    )


if __name__ == "__main__":
    main()
