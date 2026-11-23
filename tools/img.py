"""把真实截图处理成主页用的展示图：裁切、圆角、内描边、压缩。

用法：python tools/img.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
GALLERY = Path(r"E:\Ayane_Use\_gallery")

JOBS = [
    # (源文件, 输出名, 目标宽)
    (GALLERY / "satio2" / "04-dock.png", "show-room.webp", 1200),
    (GALLERY / "satio2" / "12-assets-nexus.png", "show-nexus.webp", 1200),
    (GALLERY / "satio2" / "11-panopticon.png", "show-panopticon.webp", 1200),
]


def round_corners(img: Image.Image, radius: int) -> Image.Image:
    w, h = img.size
    scale = 4
    mask = Image.new("L", (w * scale, h * scale), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, w * scale - 1, h * scale - 1], radius=radius * scale, fill=255)
    mask = mask.resize((w, h), Image.LANCZOS)
    out = img.convert("RGB").copy()
    out.putalpha(mask)
    return out


def inner_border(img: Image.Image, radius: int, alpha: int = 46) -> Image.Image:
    w, h = img.size
    scale = 4
    layer = Image.new("RGBA", (w * scale, h * scale), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle(
        [1 * scale, 1 * scale, (w - 1) * scale, (h - 1) * scale],
        radius=radius * scale,
        outline=(255, 255, 255, alpha),
        width=1 * scale,
    )
    layer = layer.resize((w, h), Image.LANCZOS)
    out = img.convert("RGBA").copy()
    out.alpha_composite(layer)
    return out


def main() -> None:
    for src, name, target_w in JOBS:
        if not src.exists():
            print(f"skip (missing): {src}")
            continue
        im = Image.open(src).convert("RGB")
        if im.width > target_w:
            im = im.resize((target_w, round(im.height * target_w / im.width)), Image.LANCZOS)
        radius = max(10, round(im.width * 0.016))
        im = round_corners(im, radius)
        im = inner_border(im, radius)
        dst = ASSETS / name
        im.save(dst, "WEBP", quality=88, method=6)
        print(f"{name}: {im.width}x{im.height} {dst.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
