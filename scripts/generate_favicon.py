# /// script
# requires-python = ">=3.11"
# dependencies = ["fonttools>=4.50", "pillow>=10", "resvg-py>=0.2"]
# ///
"""Generate public/favicon.svg and public/favicon.ico from the site's title font.

Usage: uv run scripts/generate_favicon.py
"""

import io
from pathlib import Path

import resvg_py
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from PIL import Image

PUBLIC_DIR = Path(__file__).resolve().parents[1] / "public"
FONT_PATH = PUBLIC_DIR / "assets" / "fonts" / "OuterspaceMilitia.ttf"

LETTER = "L"
TILE_SIZE = 32
CORNER_RADIUS = 6
LETTER_HEIGHT = 24
GLOW_BLUR = 0.8
GLOW_OPACITY = 0.6
ICO_SIZES = (48, 32, 16)


def build_svg(font_path: Path) -> str:
    """Return the favicon SVG, with the letter outlined so it needs no font."""
    font = TTFont(font_path)
    glyphs = font.getGlyphSet()
    glyph = glyphs[font.getBestCmap()[ord(LETTER)]]

    path_pen = SVGPathPen(glyphs, ntos=lambda value: str(round(value)))
    glyph.draw(path_pen)
    bounds_pen = BoundsPen(glyphs)
    glyph.draw(bounds_pen)
    if bounds_pen.bounds is None:
        raise ValueError(f"{font_path.name} has no outline for {LETTER!r}")
    x_min, y_min, x_max, y_max = bounds_pen.bounds

    # Font units have y pointing up, SVG has y pointing down
    scale = LETTER_HEIGHT / (y_max - y_min)
    center = TILE_SIZE / 2
    dx = center - scale * (x_min + x_max) / 2
    dy = center + scale * (y_min + y_max) / 2
    transform = f"translate({dx:.3f} {dy:.3f}) scale({scale:.5f} {-scale:.5f})"

    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {TILE_SIZE} {TILE_SIZE}">'
        "<defs>"
        f'<filter id="glow" x="0" y="0" width="{TILE_SIZE}" height="{TILE_SIZE}"'
        f' filterUnits="userSpaceOnUse"><feGaussianBlur stdDeviation="{GLOW_BLUR}"/></filter>'
        f'<path id="letter" transform="{transform}" d="{path_pen.getCommands()}"/>'
        "</defs>"
        f'<rect width="{TILE_SIZE}" height="{TILE_SIZE}" rx="{CORNER_RADIUS}" fill="#000"/>'
        f'<g filter="url(#glow)" opacity="{GLOW_OPACITY}"><use href="#letter" fill="#fff"/></g>'
        '<use href="#letter" fill="#fff"/>'
        "</svg>\n"
    )


def render(svg: str, size: int) -> Image.Image:
    """Rasterise the SVG at size x size pixels."""
    png = bytes(resvg_py.svg_to_bytes(svg_string=svg, width=size, height=size))
    return Image.open(io.BytesIO(png)).convert("RGBA")


def main() -> None:
    svg = build_svg(FONT_PATH)
    (PUBLIC_DIR / "favicon.svg").write_text(svg, encoding="utf-8")

    largest, *others = [render(svg, size) for size in ICO_SIZES]
    largest.save(
        PUBLIC_DIR / "favicon.ico",
        sizes=[(size, size) for size in ICO_SIZES],
        append_images=others,
    )


if __name__ == "__main__":
    main()
