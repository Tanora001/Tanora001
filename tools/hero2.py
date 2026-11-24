"""主页首屏：新 logo 置于白色柔光里，下面配字标。

源 logo：用户 2026-11-24 提供（531×515，白底圆角方块）。
产出 assets/hero-verse.webp（1024×572），README 里用 ?v=4 引用。
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "hero-verse.webp"
LOGO = Path(r"C:\Users\ASUS\.dsh\attachments\v1\objects\3d\3d6931f29c7ba99779952e4cf4410eb82228a10e1d5a80a4f3f9f391627f60e3")

W, H = 1024, 572
FONT_SERIF = r"C:\Windows\Fonts\georgia.ttf"
FONT_MONO = r"C:\Windows\Fonts\consola.ttf"


def tracked(draw, xy, text, font, fill, spacing):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + spacing


def main():
    # 中心白色柔光：用 numpy 逐像素算径向渐变更平滑；再撒一点抖动，避免 8bit 色带
    import numpy as np
    yy, xx = np.mgrid[0:H, 0:W]
    dist = np.sqrt((xx - W / 2) ** 2 + (yy - 230) ** 2) / 430.0
    t = np.clip((1 - dist) * 1.18, 0, 1) ** 1.45
    base = np.array([8, 9, 13], float)
    warm_white = np.array([255, 253, 249], float)
    img = base[None, None, :] * (1 - t[..., None]) + warm_white[None, None, :] * t[..., None]
    rng = np.random.default_rng(7)
    img = np.clip(img + rng.normal(0, 1.1, img.shape), 0, 255).astype(np.uint8)
    card = Image.fromarray(img, "RGB")

    d = ImageDraw.Draw(card, "RGBA")

    logo = Image.open(LOGO).convert("RGBA")
    side = min(logo.size)
    logo = logo.crop(((logo.width - side) // 2, (logo.height - side) // 2,
                      (logo.width + side) // 2, (logo.height + side) // 2))
    logo = logo.resize((172, 172), Image.LANCZOS)
    card.paste(logo, (W // 2 - 86, 118), logo)

    word = ImageFont.truetype(FONT_SERIF, 46)
    tw = d.textlength("S.A.T.I.O Verse", font=word)
    d.text(((W - tw) / 2, 318), "S.A.T.I.O Verse", font=word, fill=(26, 21, 18, 240))

    cap = ImageFont.truetype(FONT_MONO, 11)
    txt = "A CHARACTER SHELL · LOCAL FIRST"
    cw = sum(d.textlength(c, font=cap) + 3.4 for c in txt) - 3.4
    tracked(d, ((W - cw) / 2, 392), txt, cap, (58, 54, 50, 190), 3.4)

    # 四角极细角标，压住画面
    for (x, y) in ((28, 28), (W - 28, 28), (28, H - 28), (W - 28, H - 28)):
        d.line([(x - 8, y), (x + 8, y)], fill=(255, 255, 255, 40), width=1)
        d.line([(x, y - 8), (x, y + 8)], fill=(255, 255, 255, 40), width=1)

    card.save(OUT, "WEBP", quality=93, method=6)
    print("ok", OUT, OUT.stat().st_size // 1024, "KB")


main()
